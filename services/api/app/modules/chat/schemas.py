import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ChatSessionCreate(BaseModel):
    title: Optional[str] = Field(default="New Conversation", max_length=255)
    model_name: Optional[str] = Field(default="gemini-2.5-flash")
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)

class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    model_name: str
    system_prompt: Optional[str]
    temperature: float
    is_archived: bool
    last_message_at: datetime
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

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
