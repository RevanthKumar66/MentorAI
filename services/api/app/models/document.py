import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Integer, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class Document(BaseModel):
    """Document database model representing uploaded files and their metadata."""
    __tablename__ = "documents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    original_file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    file_extension: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    storage_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False
    )
    storage_provider: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    checksum: Mapped[str] = mapped_column(
        String(64),  # SHA-256
        nullable=False,
        index=True
    )
    category: Mapped[str] = mapped_column(
        String(50),  # e.g., document, dataset, code, notebook, etc.
        nullable=False,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(50),  # uploaded, deleted, processing, failed, etc.
        default="uploaded",
        server_default="uploaded",
        nullable=False
    )
    document_metadata: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        default=dict,
        server_default="{}"
    )
    
    # Versioning fields
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default="1",
        nullable=False
    )
    parent_document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Future RAG fields
    is_processed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False
    )
    processing_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        server_default="pending",
        nullable=False
    )
    processing_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="documents")
    parent: Mapped[Optional["Document"]] = relationship(
        "Document",
        remote_side="Document.id",
        back_populates="children"
    )
    children: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="parent"
    )

from app.models.user import User
Document.user = relationship("User", back_populates="documents")
