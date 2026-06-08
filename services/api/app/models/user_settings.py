import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class UserSettings(BaseModel):
    """UserSettings database model mapping user customisations."""
    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    preferred_role: Mapped[str] = mapped_column(
        String(100),
        default="learning",
        server_default="learning",
        nullable=False
    )
    theme: Mapped[str] = mapped_column(
        String(50),
        default="light",
        server_default="light",
        nullable=False
    )
    response_length: Mapped[str] = mapped_column(
        String(50),
        default="medium",
        server_default="medium",
        nullable=False
    )
    learning_goal: Mapped[str] = mapped_column(
        Text,
        default="",
        server_default="",
        nullable=False
    )
    preferred_language: Mapped[str] = mapped_column(
        String(100),
        default="english",
        server_default="english",
        nullable=False
    )
    subscription_plan: Mapped[str] = mapped_column(
        String(50),
        default="FREE",
        server_default="FREE",
        nullable=False
    )
    subscription_status: Mapped[str] = mapped_column(
        String(50),
        default="FREE",
        server_default="FREE",
        nullable=False
    )
    billing_cycle: Mapped[str] = mapped_column(
        String(50),
        default="yearly",
        server_default="yearly",
        nullable=False
    )
    subscription_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_settings")

from app.models.user import User
UserSettings.user = relationship("User", back_populates="user_settings")
