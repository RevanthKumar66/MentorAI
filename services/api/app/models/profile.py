import uuid
from typing import Optional
from sqlalchemy import ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class Profile(BaseModel):
    """Profile database model mapping preferences, learning goals, and settings."""
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False,
        index=True
    )
    bio: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True
    )
    preferences: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True,
        default=dict,
        server_default="{}"
    )
    learning_goals: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True,
        default=dict,
        server_default="{}"
    )
    settings: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True,
        default=dict,
        server_default="{}"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
from app.models.user import User
Profile.user = relationship("User", back_populates="profile")
