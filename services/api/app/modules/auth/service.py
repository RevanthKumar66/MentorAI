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
        else:
            # Sync user profile attributes if they are missing or if avatar_url is a placeholder
            updated = False
            if avatar_url and (not user.avatar_url or "avatar.vercel.sh" in user.avatar_url):
                user.avatar_url = avatar_url
                updated = True
            if full_name and not user.full_name:
                user.full_name = full_name
                updated = True
            if updated:
                await self.repo.db.flush()
        return user
