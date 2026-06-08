import uuid
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession
from app.models.collection import Collection
from app.models.note import Note
from app.models.document import Document

logger = logging.getLogger("mentorai-os.services.workspace_context")

class WorkspaceContextService:
    """Service to resolve and construct active workspace context for AI queries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_workspace_context(self, session_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Resolves the collection/workspace bound to a chat session, returning documents, notes, and metadata."""
        try:
            # 1. Look up the collection linked to this chat session
            # Since chats and collections are linked via collection_chats junction table, we query
            # the collection that contains the chat session and belongs to the user.
            stmt = (
                select(Collection)
                .join(Collection.chats)
                .options(
                    selectinload(Collection.documents),
                    selectinload(Collection.notes)
                )
                .where(
                    ChatSession.id == session_id,
                    Collection.user_id == user_id,
                    Collection.is_deleted == False
                )
            )
            res = await self.db.execute(stmt)
            collection = res.scalar_one_or_none()

            if not collection:
                return None

            # Filter out soft-deleted documents
            active_docs = [d for d in collection.documents if not d.is_deleted]
            # Filter out soft-deleted notes
            active_notes = [n for n in collection.notes if not n.is_deleted]

            return {
                "collection_id": collection.id,
                "workspace_name": collection.name,
                "workspace_description": collection.description or "",
                "color": collection.color or "slate",
                "icon": collection.icon or "Folder",
                "documents": [
                    {
                        "id": d.id,
                        "file_name": d.original_file_name,
                        "category": d.category,
                        "is_processed": d.is_processed
                    }
                    for d in active_docs
                ],
                "notes": [
                    {
                        "id": n.id,
                        "title": n.title,
                        "content": n.content
                    }
                    for n in active_notes
                ]
            }
        except Exception as e:
            logger.error(f"Error resolving workspace context for session {session_id}: {e}", exc_info=True)
            return None
