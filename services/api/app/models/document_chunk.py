import uuid
from typing import Optional
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

# Try importing pgvector
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None

class DocumentChunk(BaseModel):
    """DocumentChunk database model representing chunked document texts and their embeddings."""
    __tablename__ = "document_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    # pgvector embedding for Postgres (Vector type)
    # Falls back to standard Text representation for SQLite compatibility during create_all
    embedding = mapped_column(
        Vector(768) if Vector is not None else Text,
        nullable=True
      )
    # JSON-serialized embedding list of floats for SQLite fallback
    embedding_json: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")

from app.models.document import Document
DocumentChunk.document = relationship("Document", back_populates="chunks")
