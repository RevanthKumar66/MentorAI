from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_async_db
from app.common.exceptions import AuthException
from app.integrations.supabase.jwks import verify_supabase_jwt
from app.models.user import User
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService

# Secure authorization bearer schema
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """Dependency injection target yielding the current authenticated database User entity."""
    if not credentials:
        raise AuthException("Authentication credentials are missing.")

    token = credentials.credentials
    # Verify signature and retrieve token claims via JWKS
    payload = verify_supabase_jwt(token)
    
    supabase_uid = payload.get("sub")
    email = payload.get("email")
    
    if not supabase_uid or not email:
        raise AuthException("Bearer token payload missing sub or email claims.")
        
    user_metadata = payload.get("user_metadata", {})
    full_name = user_metadata.get("full_name") or user_metadata.get("name")
    avatar_url = user_metadata.get("avatar_url") or user_metadata.get("picture")
    
    repo = AuthRepository(db)
    service = AuthService(repo)
    
    # Check if user already registered, otherwise run auto-sync creator
    user = await service.get_or_create_user(
        supabase_uid=supabase_uid,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url
    )
    
    return user
