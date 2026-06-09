import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class UserPreferences(BaseModel):
    """UserPreferences database model mapping user customisable preferences."""
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    default_role: Mapped[str] = mapped_column(
        String(100),
        default="general",
        server_default="general",
        nullable=False
    )
    default_persona: Mapped[str] = mapped_column(
        String(100),
        default="teacher",
        server_default="teacher",
        nullable=False
    )
    experience_level: Mapped[str] = mapped_column(
        String(50),
        default="beginner",
        server_default="beginner",
        nullable=False
    )
    learning_style: Mapped[str] = mapped_column(
        String(50),
        default="mixed",
        server_default="mixed",
        nullable=False
    )
    career_goal: Mapped[str] = mapped_column(
        String(255),
        default="fullstack",
        server_default="fullstack",
        nullable=False
    )
    preferred_language: Mapped[str] = mapped_column(
        String(100),
        default="english",
        server_default="english",
        nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="user_preferences")

from app.models.user import User
UserPreferences.user = relationship("User", back_populates="user_preferences")
