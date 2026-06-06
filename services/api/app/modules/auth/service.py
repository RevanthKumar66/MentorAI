from typing import Optional
from app.models.user import User
from app.modules.auth.repository import AuthRepository

class AuthService:
    """Service layer class coordinating authentication sync workflows."""

    def __init__(self, repo: AuthRepository):
        self.repo = repo

    async def get_or_create_user(
        self, 
        supabase_uid: str, 
        email: str, 
        full_name: Optional[str] = None, 
        avatar_url: Optional[str] = None
    ) -> User:
        """Retrieves an existing user or creates a new entry on first auth login."""
        user = await self.repo.get_user_by_supabase_uid(supabase_uid)
        if user is None:
            user = await self.repo.create_user(
                supabase_uid=supabase_uid,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url
            )
        return user
