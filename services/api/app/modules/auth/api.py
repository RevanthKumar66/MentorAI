from fastapi import APIRouter, Depends
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserResponse, ProfileBase
from app.common.responses import success_response, error_response
from app.database.session import get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.profile import Profile

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile info for the currently authenticated user."""
    # Convert SQLAlchemy model to Pydantic schema
    user_schema = UserResponse.model_validate(current_user)
    return success_response(
        data=user_schema.model_dump(),
        message="User profile retrieved successfully"
    )

@router.put("/profile")
async def update_profile(
    payload: ProfileBase,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Updates the profile info for the currently authenticated user."""
    try:
        stmt = select(Profile).where(Profile.user_id == current_user.id)
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()

        if not profile:
            profile = Profile(user_id=current_user.id)
            db.add(profile)

        if payload.bio is not None:
            profile.bio = payload.bio
        if payload.preferences is not None:
            # Merge dictionary
            current_prefs = profile.preferences or {}
            current_prefs.update(payload.preferences)
            profile.preferences = current_prefs
        if payload.learning_goals is not None:
            current_goals = profile.learning_goals or {}
            current_goals.update(payload.learning_goals)
            profile.learning_goals = current_goals
        if payload.settings is not None:
            current_settings = profile.settings or {}
            current_settings.update(payload.settings)
            profile.settings = current_settings

        # Update core User fields
        if payload.full_name is not None:
            current_user.full_name = payload.full_name
        if payload.avatar_url is not None:
            current_user.avatar_url = payload.avatar_url
        if payload.email is not None:
            current_user.email = payload.email

        await db.commit()
        await db.refresh(profile)

        # Refresh current user relationship
        from sqlalchemy.orm import selectinload
        stmt_user = (
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == current_user.id)
        )
        res_user = await db.execute(stmt_user)
        user = res_user.scalar_one()

        user_schema = UserResponse.model_validate(user)
        return success_response(
            data=user_schema.model_dump(),
            message="User profile updated successfully"
        )
    except Exception as e:
        await db.rollback()
        return error_response(
            code="UPDATE_PROFILE_FAILED",
            message=str(e),
            status_code=500
        )
