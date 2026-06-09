import uuid
from typing import Optional, List
from sqlalchemy import Table, Column, String, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel, Base

# Junction table for collections and documents
collection_documents = Table(
    "collection_documents",
    Base.metadata,
    Column(
        "collection_id",
        Uuid,
        ForeignKey("collections.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "document_id",
        Uuid,
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True
    )
)

# Junction table for collections and chats
collection_chats = Table(
    "collection_chats",
    Base.metadata,
    Column(
        "collection_id",
        Uuid,
        ForeignKey("collections.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "chat_session_id",
        Uuid,
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        primary_key=True
    )
)

class Collection(BaseModel):
    """Collection database model grouping documents into specific subjects (e.g. DSA, React)."""
    __tablename__ = "collections"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    color: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    icon: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="collections")
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        secondary=collection_documents,
        back_populates="collections"
    )
    chats: Mapped[List["ChatSession"]] = relationship(
        "ChatSession",
        secondary=collection_chats,
        back_populates="collections"
    )
    notes: Mapped[List["Note"]] = relationship(
        "Note",
        back_populates="collection",
        cascade="all, delete-orphan"
    )

    @property
    def document_count(self) -> int:
        try:
            return sum(1 for d in self.documents if not d.is_deleted)
        except Exception:
            return 0


from app.models.user import User
from app.models.document import Document
from app.models.chat import ChatSession
from app.models.note import Note
Collection.user = relationship("User", back_populates="collections")
Collection.documents = relationship("Document", secondary=collection_documents, back_populates="collections")
Collection.chats = relationship("ChatSession", secondary=collection_chats, back_populates="collections")
Collection.notes = relationship("Note", back_populates="collection", cascade="all, delete-orphan")


