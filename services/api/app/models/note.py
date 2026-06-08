import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class Note(BaseModel):
    """Note database model representing user markdown notes inside a collection."""
    __tablename__ = "notes"

    collection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(
        String(255),
        default="Untitled Note",
        server_default="Untitled Note",
        nullable=False
    )
    content: Mapped[str] = mapped_column(
        Text,
        default="",
        server_default="",
        nullable=False
    )

    # Relationships
    collection: Mapped["Collection"] = relationship("Collection", back_populates="notes")
    user: Mapped["User"] = relationship("User", back_populates="notes")

from app.models.user import User
from app.models.collection import Collection
Note.user = relationship("User", back_populates="notes")
Note.collection = relationship("Collection", back_populates="notes")
