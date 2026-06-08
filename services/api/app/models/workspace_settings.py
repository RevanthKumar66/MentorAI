import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class WorkspaceSettings(BaseModel):
    """WorkspaceSettings database model storing workspace context configurations."""
    __tablename__ = "workspace_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    default_collection: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("collections.id", ondelete="SET NULL"),
        nullable=True
    )
    auto_rag_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False
    )
    citation_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False
    )
    workspace_memory_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="workspace_settings")

from app.models.user import User
WorkspaceSettings.user = relationship("User", back_populates="workspace_settings")
