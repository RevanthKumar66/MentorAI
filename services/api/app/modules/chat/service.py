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

from app.core.logging import get_logger, log_event
logger = get_logger("mentorai-os.chat.service")

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
        title: Optional[str] = None,
        model_name: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        role: Optional[str] = None,
        role_type: Optional[str] = None,
        persona_type: Optional[str] = None,
        workspace_id: Optional[uuid.UUID] = None
    ) -> ChatSession:
        title = title or "New Conversation"
        model_name = model_name or "gemini-2.5-flash"
        temperature = temperature if temperature is not None else 0.7
        role = role or "general"
        role_type = role_type or "general"
        persona_type = persona_type or "teacher"

        if role_type == "general" and role != "general":
            role_type = role

        # Get user preferences if any
        from app.models.user_preferences import UserPreferences
        from sqlalchemy import select
        prefs = None
        try:
            stmt_prefs = select(UserPreferences).where(UserPreferences.user_id == user_id)
            res_prefs = await self.db.execute(stmt_prefs)
            prefs = res_prefs.scalar_one_or_none()
        except Exception as prefs_err:
            logger.error(f"Failed to fetch user preferences: {str(prefs_err)}")

        if not system_prompt:
            from app.ai.context.context_builder import WorkspaceContextBuilder
            temp_session = ChatSession(
                role_type=role_type,
                persona_type=persona_type
            )
            system_prompt = WorkspaceContextBuilder.build_system_prompt(temp_session, prefs)
        
        session = await self.repo.create_session(
            user_id=user_id,
            title=title,
            model_name=model_name,
            system_prompt=system_prompt,
            temperature=temperature,
            role=role,
            role_type=role_type,
            persona_type=persona_type
        )

        log_event(
            logger,
            "session_created",
            session_id=str(session.id),
            role=role,
            persona=persona_type,
            workspace_id=str(workspace_id) if workspace_id else None
        )

        if workspace_id:
            from app.models.collection import Collection
            col_stmt = select(Collection).where(
                Collection.id == workspace_id,
                Collection.user_id == user_id,
                Collection.is_deleted == False
            )
            col_res = await self.db.execute(col_stmt)
            collection = col_res.scalar_one_or_none()
            if not collection:
                raise ValueError("Workspace not found or access denied")
            
            await self.repo.link_session_to_workspace(session.id, workspace_id)
            log_event(
                logger,
                "workspace_linked",
                session_id=str(session.id),
                collection_id=str(workspace_id)
            )

        await self.db.commit()
        return session

    async def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        deleted = await self.repo.delete_session(session_id, user_id)
        if deleted:
            await self.db.commit()
        return deleted

    async def update_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        payload: Any
    ) -> Optional[ChatSession]:
        """Update session metadata and handle prompt re-assembly if roles/personas change."""
        session = await self.repo.get_session_with_messages(session_id, user_id)
        if not session:
            return None

        old_role = session.role
        old_role_type = session.role_type
        old_persona = session.persona_type

        changes = {}
        if payload.title is not None:
            changes["title"] = (session.title, payload.title)
            session.title = payload.title
        if payload.temperature is not None:
            changes["temperature"] = (session.temperature, payload.temperature)
            session.temperature = payload.temperature
        if payload.is_archived is not None:
            changes["is_archived"] = (session.is_archived, payload.is_archived)
            session.is_archived = payload.is_archived
        if payload.model_name is not None:
            changes["model_name"] = (session.model_name, payload.model_name)
            session.model_name = payload.model_name

        role_updated = False
        if payload.role is not None:
            changes["role"] = (session.role, payload.role)
            session.role = payload.role
            role_updated = True
        if payload.role_type is not None:
            changes["role_type"] = (session.role_type, payload.role_type)
            session.role_type = payload.role_type
            role_updated = True
        if payload.persona_type is not None:
            changes["persona_type"] = (session.persona_type, payload.persona_type)
            session.persona_type = payload.persona_type
            role_updated = True

        if role_updated:
            log_event(
                logger,
                "role_changed",
                session_id=str(session_id),
                old_role=old_role,
                new_role=session.role,
                old_role_type=old_role_type,
                new_role_type=session.role_type,
                old_persona=old_persona,
                new_persona=session.persona_type
            )
            try:
                from app.models.user_preferences import UserPreferences as UserPrefsModel
                from sqlalchemy import select as sa_select
                prefs_stmt = sa_select(UserPrefsModel).where(UserPrefsModel.user_id == user_id)
                prefs_res = await self.db.execute(prefs_stmt)
                user_prefs = prefs_res.scalar_one_or_none()
                from app.ai.context.context_builder import WorkspaceContextBuilder
                new_prompt = WorkspaceContextBuilder.build_system_prompt(session, user_prefs)
                if new_prompt:
                    session.system_prompt = new_prompt
            except Exception as prompt_err:
                logger.warning(f"Failed to rebuild system prompt on role update: {str(prompt_err)}")

        if changes:
            log_event(
                logger,
                "session_updated",
                session_id=str(session_id),
                changes={k: str(v[1]) for k, v in changes.items()}
            )

        await self.db.commit()
        await self.db.refresh(session)
        return session


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
        content: str,
        is_retry: bool = False
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
        is_first_exchange = len(session.messages) == 0 or (
            len(session.messages) == 1
            and session.messages[0].role == "user"
            and (session.title is None or session.title == "New Conversation")
        )

        # 3. Add user message to DB if not retry or duplicate
        should_insert = True
        if is_retry or (session.messages and session.messages[-1].role == "user" and session.messages[-1].content.strip() == content.strip()):
            if session.messages and session.messages[-1].role == "user" and session.messages[-1].content.strip() == content.strip():
                should_insert = False
                logger.info(f"Retry/Duplicate detected for session {session_id}. User message already exists as the last message in DB. Skipping insertion.")

        if should_insert:
            user_msg = await self.repo.add_message(
                session_id=session_id,
                role="user",
                content=content,
                model_name=session.model_name
            )
            await self.db.commit()
            log_event(
                logger,
                "message_sent",
                session_id=str(session_id),
                role="user",
                content_preview=content[:100]
            )

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
        
        # Define helper functions using fresh database sessions for safe parallel execution
        async def _fetch_user_settings(u_id):
            from app.models.user_settings import UserSettings
            from sqlalchemy import select
            from app.database.session import async_session_maker
            async with async_session_maker() as session:
                stmt_settings = select(UserSettings).where(UserSettings.user_id == u_id)
                res_settings = await session.execute(stmt_settings)
                return res_settings.scalar_one_or_none()

        async def _fetch_user_prefs(u_id):
            from app.models.user_preferences import UserPreferences
            from sqlalchemy import select
            from app.database.session import async_session_maker
            async with async_session_maker() as session:
                stmt_prefs = select(UserPreferences).where(UserPreferences.user_id == u_id)
                res_prefs = await session.execute(stmt_prefs)
                return res_prefs.scalar_one_or_none()

        async def _fetch_workspace_context(s_id, u_id):
            from app.services.workspace_context_service import WorkspaceContextService
            from app.database.session import async_session_maker
            async with async_session_maker() as session:
                workspace_service = WorkspaceContextService(session)
                return await workspace_service.get_workspace_context(s_id, u_id)

        # Run the queries in parallel
        settings_res, prefs_res, ctx_res = await asyncio.gather(
            _fetch_user_settings(user_id),
            _fetch_user_prefs(user_id),
            _fetch_workspace_context(session_id, user_id),
            return_exceptions=True
        )

        user_settings = settings_res if not isinstance(settings_res, BaseException) else None
        user_prefs = prefs_res if not isinstance(prefs_res, BaseException) else None
        workspace_ctx = ctx_res if not isinstance(ctx_res, BaseException) else None

        if isinstance(settings_res, Exception):
            logger.error(f"Failed to fetch user settings: {settings_res}")
        if isinstance(prefs_res, Exception):
            logger.error(f"Failed to fetch user preferences: {prefs_res}")
        if isinstance(ctx_res, Exception):
            logger.error(f"Failed to fetch workspace context: {ctx_res}")

        from app.ai.context.context_builder import WorkspaceContextBuilder
        base_prompt = WorkspaceContextBuilder.build_system_prompt(session, user_prefs)

        # 5.2 Run Response Intelligence planning
        from app.intelligence.output_processor import OutputProcessor
        intel_processor = OutputProcessor()
        dynamic_system_prompt = base_prompt
        try:
            intel_plan = await intel_processor.orchestrate_planning(
                content, 
                provider=provider, 
                model=session.model_name,
                user_settings=user_settings
            )
            dynamic_system_prompt = intel_processor.construct_system_prompt(intel_plan, base_prompt)
            logger.info(f"Response Intelligence Plan created: intent={intel_plan.get('intent')}, complexity={intel_plan.get('complexity')}")
        except Exception as planning_err:
            logger.error(f"Failed to execute Response Intelligence planning: {str(planning_err)}", exc_info=True)

        
        workspace_prompt = ""
        collection_ids = None
        if workspace_ctx:
            collection_ids = [workspace_ctx["collection_id"]]
            doc_count = len(workspace_ctx["documents"])
            notes_count = len(workspace_ctx["notes"])
            
            workspace_prompt = (
                f"You are MentorAI.\n"
                f"Current Workspace: {workspace_ctx['workspace_name']}\n"
                f"Workspace Goal: {workspace_ctx['workspace_description']}\n"
                f"Documents Available: {doc_count}\n"
                f"Notes Available: {notes_count}\n\n"
                f"Always prioritize workspace knowledge before using general knowledge.\n"
                f"If information is retrieved from workspace documents, cite the source.\n"
                f"If information is unavailable in workspace documents, clearly state that and then answer using general knowledge.\n\n"
            )
            
            # Inject Active Notes
            if workspace_ctx["notes"]:
                notes_block = []
                for n in workspace_ctx["notes"]:
                    notes_block.append(f"[Note: {n['title']}]\n{n['content']}")
                workspace_prompt += (
                    "=== ACTIVE WORKSPACE NOTES ===\n"
                    + "\n\n".join(notes_block)
                    + "\n=============================\n\n"
                )

        # 5.4 Fetch relevant RAG chunks if user has active documents or workspace
        from app.services.rag_service import RAGService
        rag_service = RAGService(self.db)
        rag_context = ""
        retrieved_chunks = []
        try:
            chunks = await rag_service.get_similar_chunks(
                user_id=user_id, 
                query=content, 
                collection_ids=collection_ids, 
                k=5
            )
            if chunks:
                retrieved_chunks = chunks
                log_event(
                    logger,
                    "rag_retrieved",
                    session_id=str(session_id),
                    chunk_count=len(chunks),
                    query_preview=content[:100]
                )
                context_parts = []
                for c in chunks:
                    score_pct = int(c["score"] * 100)
                    context_parts.append(
                        f"[File: {c['file_name']} (Chunk {c['chunk_index']}, Relevance: {score_pct}%)]\n{c['content']}"
                    )
                rag_context = (
                    "=== RETRIEVED WORKSPACE KNOWLEDGE (RAG) ===\n"
                    "The following verified context from the user's uploaded workspace files is highly relevant to the query. "
                    "Incorporate this knowledge to answer the user's question accurately. "
                    "Cite or reference the specific source file name(s) where appropriate.\n\n"
                    + "\n\n".join(context_parts)
                    + "\n============================================\n\n"
                )
        except Exception as rag_err:
            logger.error(f"Failed to query RAG chunks: {rag_err}", exc_info=True)

        if workspace_prompt:
            dynamic_system_prompt = f"{workspace_prompt}{dynamic_system_prompt}"
        if rag_context:
            dynamic_system_prompt = f"{rag_context}{dynamic_system_prompt}"

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

            # Format citations
            citations_list = None
            if retrieved_chunks:
                citations_list = [
                    {
                        "source": c["file_name"],
                        "page": 1,
                        "chunk": c["chunk_index"],
                        "score": round(c["score"], 2)
                    }
                    for c in retrieved_chunks
                ]

            # 6. Save Assistant response message to DB
            assistant_msg = await self.repo.add_message(
                session_id=session_id,
                role="assistant",
                content=accumulated_text,
                model_name=session.model_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms,
                citations=citations_list
            )
            await self.db.commit()
            
            log_event(
                logger,
                "stream_completed",
                session_id=str(session_id),
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms
            )

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

                try:
                    from app.ai.analytics.analytics_service import AnalyticsService
                    await AnalyticsService.track_message(
                        db=self.db,
                        user_id=user_id,
                        role=session.role_type or "general",
                        tokens_used=input_tokens + output_tokens,
                        is_new_session=is_first_exchange
                    )
                except Exception as anal_err:
                    logger.error(f"Failed to log role analytics: {str(anal_err)}")

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

            # Stream citations list before [DONE]
            if retrieved_chunks:
                citations = [
                    {
                        "source": c["file_name"],
                        "page": 1,
                        "chunk": c["chunk_index"],
                        "score": round(c["score"], 2)
                    }
                    for c in retrieved_chunks
                ]
                yield f"data: {json.dumps({'citations': citations})}\n\n"

            # Yield done signal
            yield "data: [DONE]\n\n"

        except Exception as e:
            log_event(
                logger,
                "stream_error",
                session_id=str(session_id),
                error_type=type(e).__name__,
                error_message=str(e)
            )
            logger.error(f"Error during chat stream orchestration: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': f'Streaming generation failed: {str(e)}'})}\n\n"
