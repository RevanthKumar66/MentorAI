import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, update, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document

class DocumentRepository:
    """Repository class managing database interactions for Document entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Document]:
        """Fetch a specific document belonging to user, excluding soft-deleted ones."""
        stmt = (
            select(Document)
            .where(
                Document.id == document_id,
                Document.user_id == user_id,
                Document.is_deleted == False
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_document_by_checksum(self, checksum: str, user_id: uuid.UUID) -> Optional[Document]:
        """Fetch an active document by its SHA256 checksum for a specific user."""
        stmt = (
            select(Document)
            .where(
                Document.checksum == checksum,
                Document.user_id == user_id,
                Document.is_deleted == False
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_documents(
        self,
        user_id: uuid.UUID,
        category: Optional[str] = None,
        search_query: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Document], int]:
        """Fetch a paginated list of active documents for a user, with filters."""
        # Calculate offset
        offset = (page - 1) * limit

        # Base query
        stmt = select(Document).where(
            Document.user_id == user_id,
            Document.is_deleted == False
        )

        # Filters
        if category:
            stmt = stmt.where(Document.category == category)
        if search_query:
            stmt = stmt.where(
                or_(
                    Document.file_name.ilike(f"%{search_query}%"),
                    Document.original_file_name.ilike(f"%{search_query}%")
                )
            )

        # Count total matches before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Apply pagination & sorting (newest first)
        stmt = stmt.order_by(Document.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def create_document(
        self,
        user_id: uuid.UUID,
        file_name: str,
        original_file_name: str,
        file_extension: str,
        mime_type: str,
        file_size: int,
        storage_path: str,
        storage_provider: str,
        checksum: str,
        category: str,
        document_metadata: Optional[dict] = None,
        parent_document_id: Optional[uuid.UUID] = None,
        version: int = 1
    ) -> Document:
        """Create a new Document record in the database."""
        doc = Document(
            user_id=user_id,
            file_name=file_name,
            original_file_name=original_file_name,
            file_extension=file_extension,
            mime_type=mime_type,
            file_size=file_size,
            storage_path=storage_path,
            storage_provider=storage_provider,
            checksum=checksum,
            category=category,
            document_metadata=document_metadata or {},
            parent_document_id=parent_document_id,
            version=version,
            status="uploaded"
        )
        self.db.add(doc)
        await self.db.flush()
        return doc

    async def soft_delete_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Mark a document as deleted (soft delete)."""
        stmt = (
            update(Document)
            .where(
                Document.id == document_id,
                Document.user_id == user_id,
                Document.is_deleted == False
            )
            .values(
                is_deleted=True,
                deleted_at=func.now(),
                status="deleted"
            )
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0
