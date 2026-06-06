from fastapi import APIRouter, Depends
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserResponse
from app.common.responses import success_response

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
