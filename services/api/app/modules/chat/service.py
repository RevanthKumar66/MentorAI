import os
import uuid
import logging
import asyncio
import json
from typing import List, Optional, AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatSession, ChatMessage
from app.modules.chat.repository import ChatRepository
from app.modules.usage.service import UsageService
from app.llm.providers.factory import LLMProviderFactory
from app.llm.exceptions import LLMProviderException

logger = logging.getLogger("mentorai-os.chat.service")

def get_prompt_path(filename: str) -> str:
    """Traverses up directories to find packages/prompts/chat/filename."""
    current = os.path.abspath(__file__)
    for _ in range(10):
        current = os.path.dirname(current)
        candidate = os.path.join(current, "packages", "prompts", "chat", filename)
        if os.path.exists(candidate):
            return candidate
    # Default fallback to absolute path
    return os.path.join("c:", os.sep, "Users", "Admin", "OneDrive", "Desktop", "mentorai-os", "packages", "prompts", "chat", filename)

def read_prompt(filename: str) -> str:
    """Reads the template prompt markdown file."""
    path = get_prompt_path(filename)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        logger.error(f"Failed to read prompt file {filename}: {str(e)}")
        return ""

class ChatService:
    """Service layer class coordinating Chat session logic, LLM streaming, and usage logs."""

    def __init__(self, repo: ChatRepository, usage_service: UsageService, db: AsyncSession):
        self.repo = repo
        self.usage_service = usage_service
        self.db = db

    async def list_sessions(self, user_id: uuid.UUID) -> List[ChatSession]:
        return await self.repo.get_sessions_by_user(user_id)

    async def get_session_details(self, session_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ChatSession]:
        return await self.repo.get_session_with_messages(session_id, user_id)

    async def create_session(
        self,
        user_id: uuid.UUID,
        title: str = "New Conversation",
        model_name: str = "gemini-2.5-flash",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> ChatSession:
        if not system_prompt:
            system_prompt = read_prompt("system.md")
        
        session = await self.repo.create_session(
            user_id=user_id,
            title=title,
            model_name=model_name,
            system_prompt=system_prompt,
            temperature=temperature
        )
        await self.db.commit()
        return session

    async def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        deleted = await self.repo.delete_session(session_id, user_id)
        if deleted:
            await self.db.commit()
        return deleted

    async def generate_chat_title(self, user_message: str, model_name: str) -> str:
        """Call the LLM provider using title_generator template to generate a concise title."""
        template = read_prompt("title_generator.md")
        if not template:
            template = "Generate a short, concise, and clean title (2 to 4 words max) that summarizes the following user conversation starter.\nUser Message:\n{message}"
        
        prompt = template.format(message=user_message)
        
        try:
            # Instantiate provider based on factory configured provider
            provider = LLMProviderFactory.get_provider()
            messages = [{"role": "user", "content": prompt}]
            
            res = await provider.generate(
                messages=messages,
                model=model_name,
                temperature=0.3
            )
            title = res.get("text", "").strip()
            
            # Strip any double/single quotes or markdown artifacts
            title = title.replace('"', '').replace("'", "").replace("*", "").replace("#", "").strip()
            
            # Truncate if somehow it returned a very long response
            if len(title) > 50:
                title = title[:47] + "..."
            
            return title or "New Conversation"
        except Exception as e:
            logger.error(f"Failed to generate title: {str(e)}")
            return "New Conversation"

    async def stream_chat_response(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        content: str
    ) -> AsyncGenerator[str, None]:
        """Handles user message insertion, streaming response via SSE, logging usage, and titles.
        
        Yields:
            JSON strings containing token fragments or terminal metadata.
        """
        # 1. Verify session exists and belongs to user
        session = await self.repo.get_session_with_messages(session_id, user_id)
        if not session:
            logger.error(f"ChatSession {session_id} not found or unauthorized for user {user_id}")
            yield "data: {\"error\": \"Chat session not found or unauthorized\"}\n\n"
            return

        # 2. Count messages to check if this is the first exchange
        is_first_exchange = len(session.messages) == 0

        # 3. Add user message to DB
        user_msg = await self.repo.add_message(
            session_id=session_id,
            role="user",
            content=content,
            model_name=session.model_name
        )
        await self.db.commit()

        # Load messages directly from DB to bypass SQLAlchemy identity map cache gotchas
        from sqlalchemy import select
        msg_stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        msg_result = await self.db.execute(msg_stmt)
        db_messages = msg_result.scalars().all()

        # 4. Construct messages payload
        messages_payload = []
        for msg in db_messages:
            messages_payload.append({
                "role": msg.role,
                "content": msg.content
            })

        # 5. Instantiate Provider
        provider = LLMProviderFactory.get_provider()
        
        # 5.1 Run Response Intelligence planning
        from app.intelligence.output_processor import OutputProcessor
        intel_processor = OutputProcessor()
        dynamic_system_prompt = session.system_prompt
        try:
            intel_plan = await intel_processor.orchestrate_planning(content, provider=provider, model=session.model_name)
            dynamic_system_prompt = intel_processor.construct_system_prompt(intel_plan, session.system_prompt or "")
            logger.info(f"Response Intelligence Plan created: intent={intel_plan.get('intent')}, complexity={intel_plan.get('complexity')}")
        except Exception as planning_err:
            logger.error(f"Failed to execute Response Intelligence planning: {str(planning_err)}", exc_info=True)

        accumulated_text = ""
        input_tokens = 0
        output_tokens = 0
        latency_ms = 0

        try:
            # Get streaming generator
            async_gen = provider.stream(
                messages=messages_payload,
                model=session.model_name,
                system_prompt=dynamic_system_prompt,
                temperature=session.temperature
            )

            # Stream chunks back to client
            async for chunk in async_gen:
                text_chunk = chunk.get("text", "")
                if text_chunk:
                    accumulated_text += text_chunk
                    # Yield SSE formatted data
                    yield f"data: {json.dumps({'chunk': text_chunk})}\n\n"
                
                # Check for terminal chunk metrics
                if chunk.get("input_tokens") is not None:
                    input_tokens = chunk["input_tokens"] or 0
                if chunk.get("output_tokens") is not None:
                    output_tokens = chunk["output_tokens"] or 0
                if chunk.get("latency_ms") is not None:
                    latency_ms = chunk["latency_ms"] or 0

            # 6. Save Assistant response message to DB
            assistant_msg = await self.repo.add_message(
                session_id=session_id,
                role="assistant",
                content=accumulated_text,
                model_name=session.model_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms
            )
            await self.db.commit()

            # 7. Log usage metrics asynchronously
            if input_tokens > 0 or output_tokens > 0:
                await self.usage_service.log_api_usage(
                    user_id=user_id,
                    provider=provider.__class__.__name__,
                    model=session.model_name,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    latency_ms=latency_ms
                )
                await self.db.commit()

            # 8. First exchange title auto-generator (non-blocking title update)
            if is_first_exchange:
                try:
                    new_title = await self.generate_chat_title(content, session.model_name)
                    if new_title and new_title != "New Conversation":
                        await self.repo.update_session_title(session_id, new_title)
                        await self.db.commit()
                        # Yield a title update message through the SSE stream so client receives it
                        yield f"data: {json.dumps({'title': new_title})}\n\n"
                except Exception as ex:
                    logger.error(f"Failed to auto-generate session title: {str(ex)}")

            # Yield done signal
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Error during chat stream orchestration: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': f'Streaming generation failed: {str(e)}'})}\n\n"
