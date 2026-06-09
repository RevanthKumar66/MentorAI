import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_async_db
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.ai.registry.registry import ROLES, PERSONAS
from app.ai.analytics.analytics_service import AnalyticsService
from app.modules.chat.schemas import UserPreferencesResponse, UserPreferencesUpdate

logger = logging.getLogger("mentorai-os.chat.workspace_api")

router = APIRouter(tags=["Workspace & Role Intelligence"])

@router.get("/roles")
async def get_roles(current_user: User = Depends(get_current_user)):
    """Retrieve list of available roles and their metadata."""
    return success_response(
        data=list(ROLES.values()),
        message="Roles retrieved successfully"
    )

@router.get("/personas")
async def get_personas(current_user: User = Depends(get_current_user)):
    """Retrieve list of available personas and their metadata."""
    return success_response(
        data=list(PERSONAS.values()),
        message="Personas retrieved successfully"
    )


@router.get("/preferences")
async def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve the authenticated user's preferences, initializing defaults if none exist."""
    stmt = select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    res = await db.execute(stmt)
    prefs = res.scalar_one_or_none()
    
    if not prefs:
        prefs = UserPreferences(
            user_id=current_user.id,
            default_role="general",
            default_persona="teacher",
            experience_level="beginner",
            learning_style="mixed",
            career_goal="fullstack",
            preferred_language="english"
        )
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
        
    return success_response(
        data=UserPreferencesResponse.model_validate(prefs).model_dump(),
        message="User preferences retrieved successfully"
    )

@router.put("/preferences")
async def update_user_preferences(
    payload: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update user's intelligence layer and workspace preferences."""
    stmt = select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    res = await db.execute(stmt)
    prefs = res.scalar_one_or_none()
    
    if not prefs:
        prefs = UserPreferences(
            user_id=current_user.id,
            default_role="general",
            default_persona="teacher",
            experience_level="beginner",
            learning_style="mixed",
            career_goal="fullstack",
            preferred_language="english"
        )
        db.add(prefs)
        
    # Update fields if provided in payload
    if payload.default_role is not None:
        prefs.default_role = payload.default_role
    if payload.default_persona is not None:
        prefs.default_persona = payload.default_persona
    if payload.experience_level is not None:
        prefs.experience_level = payload.experience_level
    if payload.learning_style is not None:
        prefs.learning_style = payload.learning_style
    if payload.career_goal is not None:
        prefs.career_goal = payload.career_goal
    if payload.preferred_language is not None:
        prefs.preferred_language = payload.preferred_language
        
    try:
        await db.commit()
        await db.refresh(prefs)
        return success_response(
            data=UserPreferencesResponse.model_validate(prefs).model_dump(),
            message="User preferences updated successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update preferences: {str(e)}")
        return error_response(
            code="UPDATE_PREFERENCES_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/analytics")
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve usage analytics dashboard metrics for the authenticated user."""
    try:
        analytics = await AnalyticsService.get_user_analytics(db, current_user.id)
        return success_response(
            data=analytics,
            message="User analytics compiled successfully"
        )
    except Exception as e:
        logger.error(f"Failed to compile user analytics: {str(e)}", exc_info=True)
        return error_response(
            code="ANALYTICS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
