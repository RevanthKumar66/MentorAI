from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.user import User
from app.models.profile import Profile

class AuthRepository:
    """Repository pattern class for database queries involving users and profiles."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_supabase_uid(self, supabase_uid: str) -> Optional[User]:
        """Fetches a user profile by their unique Supabase UID."""
        stmt = (
            select(User)
            .where(User.supabase_user_id == supabase_uid, User.is_deleted == False)
            .options(selectinload(User.profile))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user(
        self, 
        supabase_uid: str, 
        email: str, 
        full_name: Optional[str] = None, 
        avatar_url: Optional[str] = None
    ) -> User:
        """Creates a new User and builds their empty associated Profile."""
        user = User(
            supabase_user_id=supabase_uid,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url
        )
        self.db.add(user)
        await self.db.flush()  # Flush to populate user.id

        # Generate corresponding profile
        profile = Profile(
            user_id=user.id,
            bio="",
            preferences={},
            learning_goals={},
            settings={}
        )
        self.db.add(profile)
        await self.db.flush()

        # Refresh to load relationships
        stmt = (
            select(User)
            .where(User.id == user.id)
            .options(selectinload(User.profile))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()
