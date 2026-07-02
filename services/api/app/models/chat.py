import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Text, Integer, Float, Boolean, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class ChatSession(BaseModel):
    """ChatSession model representing a conversation window between user and AI agent."""
    __tablename__ = "chat_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(
        String(255),
        default="New Conversation",
        nullable=False
    )
    model_name: Mapped[str] = mapped_column(
        String(100),
        default="gemini-2.0-flash",
        nullable=False
    )
    system_prompt: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    temperature: Mapped[float] = mapped_column(
        Float,
        default=0.7,
        server_default="0.7",
        nullable=False
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(50),
        default="general",
        server_default="general",
        nullable=False
    )
    role_type: Mapped[str] = mapped_column(
        String(100),
        default="general",
        server_default="general",
        nullable=False,
        index=True
    )
    persona_type: Mapped[str] = mapped_column(
        String(100),
        default="teacher",
        server_default="teacher",
        nullable=False
    )
    last_message_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chat_sessions")
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", 
        back_populates="session", 
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )
    collections: Mapped[List["Collection"]] = relationship(
        "Collection",
        secondary="collection_chats",
        back_populates="chats"
    )


class ChatMessage(BaseModel):
    """ChatMessage model containing conversation exchange content."""
    __tablename__ = "chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role: Mapped[str] = mapped_column(
        String(50),  # user, assistant, system
        nullable=False
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    model_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    token_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False
    )
    input_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False
    )
    output_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False
    )
    latency_ms: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False
    )
    citations: Mapped[Optional[list]] = mapped_column(
        JSON,
        nullable=True
    )


    # Relationships
    session: Mapped[ChatSession] = relationship(ChatSession, back_populates="messages")

from app.models.user import User
from app.models.collection import Collection, collection_chats
ChatSession.user = relationship("User", back_populates="chat_sessions")
ChatSession.messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
ChatSession.collections = relationship("Collection", secondary=collection_chats, back_populates="chats")
ChatMessage.session = relationship(ChatSession, back_populates="messages")

