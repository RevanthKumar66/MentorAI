import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ChatSessionCreate(BaseModel):
    title: Optional[str] = Field(default="New Conversation", max_length=255)
    model_name: Optional[str] = Field(default="gemini-2.0-flash")
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    role: Optional[str] = Field(default="general")
    role_type: Optional[str] = Field(default="general")
    persona_type: Optional[str] = Field(default="teacher")
    workspace_id: Optional[uuid.UUID] = None


class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    model_name: str
    system_prompt: Optional[str]
    temperature: float
    is_archived: bool
    role: str = "general"
    role_type: str = "general"
    persona_type: str = "teacher"
    last_message_at: datetime
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    role: Optional[str] = None
    role_type: Optional[str] = None
    persona_type: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    is_archived: Optional[bool] = None

class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    model_name: Optional[str]
    input_tokens: int
    output_tokens: int
    latency_ms: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class ChatSessionDetailResponse(ChatSessionResponse):
    messages: List[ChatMessageResponse] = []

    model_config = {
        "from_attributes": True
    }

class ChatMessageSend(BaseModel):
    content: str
    is_retry: bool = False

class UserPreferencesResponse(BaseModel):
    default_role: str
    default_persona: str
    experience_level: str
    learning_style: str
    career_goal: str
    preferred_language: str

    model_config = {
        "from_attributes": True
    }

class UserPreferencesUpdate(BaseModel):
    default_role: Optional[str] = None
    default_persona: Optional[str] = None
    experience_level: Optional[str] = None
    learning_style: Optional[str] = None
    career_goal: Optional[str] = None
    preferred_language: Optional[str] = None

