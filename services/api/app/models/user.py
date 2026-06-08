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
    collections: Mapped[List["Collection"]] = relationship(
        "Collection",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    user_settings: Mapped["UserSettings"] = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    notes: Mapped[List["Note"]] = relationship(
        "Note",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    workspace_settings: Mapped["WorkspaceSettings"] = relationship(
        "WorkspaceSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

from app.models.profile import Profile
from app.models.chat import ChatSession
from app.models.usage import UsageLog
from app.models.document import Document
from app.models.collection import Collection
from app.models.user_settings import UserSettings
from app.models.note import Note
from app.models.workspace_settings import WorkspaceSettings
User.profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
User.chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
User.usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
User.documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
User.collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")
User.user_settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
User.notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
User.workspace_settings = relationship("WorkspaceSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

