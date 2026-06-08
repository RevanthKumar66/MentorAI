import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_async_db
from app.models.user import User
from app.models.workspace_settings import WorkspaceSettings
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.documents.schemas import (
    WorkspaceSettingsResponse,
    WorkspaceSettingsUpdate
)

logger = logging.getLogger("mentorai-os.workspace_settings.api")

router = APIRouter(prefix="/settings/workspace", tags=["Workspace Settings"])

@router.get("")
async def get_workspace_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve workspace settings for the authenticated user, creating defaults if not found."""
    try:
        stmt = select(WorkspaceSettings).where(WorkspaceSettings.user_id == current_user.id)
        res = await db.execute(stmt)
        settings_obj = res.scalar_one_or_none()

        if not settings_obj:
            # Create default workspace settings
            settings_obj = WorkspaceSettings(
                user_id=current_user.id,
                default_collection=None,
                auto_rag_enabled=True,
                citation_enabled=True,
                workspace_memory_enabled=True
            )
            db.add(settings_obj)
            await db.commit()
            await db.refresh(settings_obj)

        data = WorkspaceSettingsResponse.model_validate(settings_obj)
        return success_response(
            data=data.model_dump(),
            message="Workspace settings retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error retrieving workspace settings: {str(e)}", exc_info=True)
        return error_response(
            code="GET_WORKSPACE_SETTINGS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.put("")
async def update_workspace_settings(
    payload: WorkspaceSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update workspace settings for the user."""
    try:
        stmt = select(WorkspaceSettings).where(WorkspaceSettings.user_id == current_user.id)
        res = await db.execute(stmt)
        settings_obj = res.scalar_one_or_none()

        if not settings_obj:
            settings_obj = WorkspaceSettings(
                user_id=current_user.id,
                default_collection=None,
                auto_rag_enabled=True,
                citation_enabled=True,
                workspace_memory_enabled=True
            )
            db.add(settings_obj)

        # Update fields
        if payload.default_collection is not None:
            settings_obj.default_collection = payload.default_collection
        if payload.auto_rag_enabled is not None:
            settings_obj.auto_rag_enabled = payload.auto_rag_enabled
        if payload.citation_enabled is not None:
            settings_obj.citation_enabled = payload.citation_enabled
        if payload.workspace_memory_enabled is not None:
            settings_obj.workspace_memory_enabled = payload.workspace_memory_enabled

        await db.commit()
        await db.refresh(settings_obj)

        data = WorkspaceSettingsResponse.model_validate(settings_obj)
        return success_response(
            data=data.model_dump(),
            message="Workspace settings updated successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating workspace settings: {str(e)}", exc_info=True)
        return error_response(
            code="UPDATE_WORKSPACE_SETTINGS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
