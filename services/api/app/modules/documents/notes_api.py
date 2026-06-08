import uuid
import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.session import get_async_db
from app.models.user import User
from app.models.note import Note
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.documents.schemas import NoteResponse, NoteUpdate

logger = logging.getLogger("mentorai-os.notes.api")

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.patch("/{note_id}")
async def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Updates a note's title and/or content."""
    try:
        stmt = select(Note).where(
            Note.id == note_id,
            Note.user_id == current_user.id,
            Note.is_deleted == False
        )
        res = await db.execute(stmt)
        note = res.scalar_one_or_none()
        if not note:
            return error_response(
                code="NOT_FOUND",
                message="Note not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if payload.title is not None:
            note.title = payload.title
        if payload.content is not None:
            note.content = payload.content

        await db.commit()
        await db.refresh(note)

        data = NoteResponse.model_validate(note)
        return success_response(
            data=data.model_dump(),
            message="Note updated successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating note: {str(e)}", exc_info=True)
        return error_response(
            code="UPDATE_NOTE_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/{note_id}")
async def delete_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Soft deletes a note."""
    try:
        stmt = select(Note).where(
            Note.id == note_id,
            Note.user_id == current_user.id,
            Note.is_deleted == False
        )
        res = await db.execute(stmt)
        note = res.scalar_one_or_none()
        if not note:
            return error_response(
                code="NOT_FOUND",
                message="Note not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        note.is_deleted = True
        note.deleted_at = func.now()
        await db.commit()

        return success_response(
            message="Note deleted successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting note: {str(e)}", exc_info=True)
        return error_response(
            code="DELETE_NOTE_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
