import uuid
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from pgvector.sqlalchemy import Vector

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
    embedding = mapped_column(
        Vector(768),
        nullable=True
    )

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")

from app.models.document import Document
DocumentChunk.document = relationship("Document", back_populates="chunks")

