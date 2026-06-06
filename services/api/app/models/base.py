import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Boolean, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """Base declarative class for SQLAlchemy ORM mapping."""
    pass

class BaseModel(Base):
    """Base model with common properties: UUID id, timestamps, and soft delete."""
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        server_default="false"
    )
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )
