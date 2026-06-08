import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr

class ProfileBase(BaseModel):
    bio: Optional[str] = None
    preferences: dict = {}
    learning_goals: dict = {}
    settings: dict = {}
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None

class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    profile: Optional[ProfileResponse] = None
