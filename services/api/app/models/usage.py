import uuid
from sqlalchemy import String, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class UsageLog(BaseModel):
    """UsageLog model representing usage metrics and API token counts for billing or analytics."""
    __tablename__ = "usage_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    provider: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    input_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False
    )
    output_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False
    )
    latency_ms: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False
    )
    cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        server_default="0.0",
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="usage_logs")

from app.models.user import User
UsageLog.user = relationship("User", back_populates="usage_logs")
