import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession, ChatMessage

class ChatRepository:
    """Repository class managing database interactions for ChatSession and ChatMessage entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_sessions_by_user(self, user_id: uuid.UUID, include_archived: bool = False) -> List[ChatSession]:
        """Fetch all chat sessions for a specific user, sorted by last_message_at descending."""
        stmt = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
        )
        if not include_archived:
            stmt = stmt.where(ChatSession.is_archived == False)
            
        stmt = stmt.order_by(ChatSession.last_message_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ChatSession]:
        """Fetch a specific chat session and verify it belongs to the user."""
        stmt = (
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_session_with_messages(self, session_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ChatSession]:
        """Fetch a specific chat session with its messages preloaded, verifying ownership."""
        stmt = (
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .options(selectinload(ChatSession.messages))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_session(
        self,
        user_id: uuid.UUID,
        title: str = "New Conversation",
        model_name: str = "gemini-2.5-flash",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> ChatSession:
        """Create a new ChatSession."""
        session = ChatSession(
            user_id=user_id,
            title=title,
            model_name=model_name,
            system_prompt=system_prompt,
            temperature=temperature
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def add_message(
        self,
        session_id: uuid.UUID,
        role: str,
        content: str,
        model_name: Optional[str] = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        latency_ms: int = 0
    ) -> ChatMessage:
        """Add a ChatMessage to a session and touch the last_message_at timestamp."""
        # Create message
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            model_name=model_name,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms
        )
        self.db.add(message)
        
        # Touch the parent session's last_message_at field
        await self.db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(last_message_at=datetime.utcnow())
        )
        
        await self.db.flush()
        return message

    async def update_session_title(self, session_id: uuid.UUID, title: str) -> None:
        """Update the title of a specific ChatSession."""
        await self.db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(title=title)
        )
        await self.db.flush()

    async def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a chat session if it belongs to the user."""
        stmt = (
            delete(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0

    async def archive_session(self, session_id: uuid.UUID, user_id: uuid.UUID, archive: bool = True) -> bool:
        """Archive or unarchive a session."""
        stmt = (
            update(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .values(is_archived=archive)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0
