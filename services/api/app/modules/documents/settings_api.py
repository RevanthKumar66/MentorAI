import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_async_db
from app.models.user import User
from app.models.user_settings import UserSettings
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.documents.schemas import (
    UserSettingsResponse,
    UserSettingsUpdate
)

logger = logging.getLogger("mentorai-os.settings.api")

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve settings for the authenticated user, creating defaults if not found."""
    try:
        stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
        res = await db.execute(stmt)
        settings_obj = res.scalar_one_or_none()

        if not settings_obj:
            # Create default settings
            settings_obj = UserSettings(
                user_id=current_user.id,
                preferred_role="learning",
                theme="light",
                response_length="medium",
                learning_goal="",
                preferred_language="english"
            )
            db.add(settings_obj)
            await db.commit()
            await db.refresh(settings_obj)

        data = UserSettingsResponse.model_validate(settings_obj)
        return success_response(
            data=data.model_dump(),
            message="User settings retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error retrieving user settings: {str(e)}", exc_info=True)
        return error_response(
            code="GET_SETTINGS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.put("")
async def update_settings(
    payload: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update user settings."""
    try:
        stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
        res = await db.execute(stmt)
        settings_obj = res.scalar_one_or_none()

        if not settings_obj:
            settings_obj = UserSettings(
                user_id=current_user.id
            )
            db.add(settings_obj)

        # Update fields
        if payload.preferred_role is not None:
            settings_obj.preferred_role = payload.preferred_role
        if payload.theme is not None:
            settings_obj.theme = payload.theme
        if payload.response_length is not None:
            settings_obj.response_length = payload.response_length
        if payload.learning_goal is not None:
            settings_obj.learning_goal = payload.learning_goal
        if payload.preferred_language is not None:
            settings_obj.preferred_language = payload.preferred_language
        if payload.subscription_plan is not None:
            settings_obj.subscription_plan = payload.subscription_plan
        if payload.subscription_status is not None:
            settings_obj.subscription_status = payload.subscription_status
        if payload.billing_cycle is not None:
            settings_obj.billing_cycle = payload.billing_cycle
        if payload.subscription_started_at is not None:
            settings_obj.subscription_started_at = payload.subscription_started_at
        if payload.subscription_expires_at is not None:
            settings_obj.subscription_expires_at = payload.subscription_expires_at

        await db.commit()
        await db.refresh(settings_obj)

        data = UserSettingsResponse.model_validate(settings_obj)
        return success_response(
            data=data.model_dump(),
            message="User settings updated successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating user settings: {str(e)}", exc_info=True)
        return error_response(
            code="UPDATE_SETTINGS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
