from typing import Optional, List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class User(BaseModel):
    """User database model representation mapping authenticated user credentials."""
    __tablename__ = "users"

    supabase_user_id: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        index=True, 
        nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        index=True, 
        nullable=False
    )
    full_name: Mapped[Optional[str]] = mapped_column(
        String(255), 
        nullable=True
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(1024), 
        nullable=True
    )

    # Relationships
    profile: Mapped["Profile"] = relationship(
        "Profile", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan"
    )
    chat_sessions: Mapped[List["ChatSession"]] = relationship(
        "ChatSession", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    usage_logs: Mapped[List["UsageLog"]] = relationship(
        "UsageLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="user",
        cascade="all, delete-orphan"
    )

from app.models.profile import Profile
from app.models.chat import ChatSession
from app.models.usage import UsageLog
from app.models.document import Document
User.profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
User.chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
User.usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
User.documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
