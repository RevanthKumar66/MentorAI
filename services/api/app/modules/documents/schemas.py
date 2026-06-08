import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class DocumentResponse(BaseModel):
    """Pydantic model representing a Document's details."""
    id: uuid.UUID
    user_id: uuid.UUID
    file_name: str
    original_file_name: str
    file_extension: str
    mime_type: str
    file_size: int
    storage_path: str
    storage_provider: str
    checksum: str
    category: str
    status: str
    document_metadata: Optional[Dict[str, Any]] = None
    version: int
    parent_document_id: Optional[uuid.UUID] = None
    is_processed: bool
    processing_status: str
    processing_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class DocumentDownloadResponse(BaseModel):
    """Pydantic model containing signed URL download information."""
    download_url: str
    expires_in: int = Field(default=3600)

class DocumentListResponse(BaseModel):
    """Pydantic model for paginated list of Documents."""
    items: List[DocumentResponse]
    total: int
    page: int
    limit: int

class CollectionCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None

class CollectionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CollectionDetailResponse(CollectionResponse):
    documents: List[DocumentResponse] = []

    model_config = {
        "from_attributes": True
    }

class UserSettingsUpdate(BaseModel):
    preferred_role: Optional[str] = "learning"
    theme: Optional[str] = "light"
    response_length: Optional[str] = "medium"
    learning_goal: Optional[str] = ""
    preferred_language: Optional[str] = "english"
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    billing_cycle: Optional[str] = None
    subscription_started_at: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None

class UserSettingsResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    preferred_role: str
    theme: str
    response_length: str
    learning_goal: str
    preferred_language: str
    subscription_plan: str
    subscription_status: str
    billing_cycle: str
    subscription_started_at: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)
    icon: Optional[str] = Field(None, max_length=50)

class NoteCreate(BaseModel):
    title: Optional[str] = Field("Untitled Note", max_length=255)
    content: Optional[str] = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None

class NoteResponse(BaseModel):
    id: uuid.UUID
    collection_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class WorkspaceSettingsResponse(BaseModel):
    user_id: uuid.UUID
    default_collection: Optional[uuid.UUID] = None
    auto_rag_enabled: bool
    citation_enabled: bool
    workspace_memory_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class WorkspaceSettingsUpdate(BaseModel):
    default_collection: Optional[uuid.UUID] = None
    auto_rag_enabled: Optional[bool] = None
    citation_enabled: Optional[bool] = None
    workspace_memory_enabled: Optional[bool] = None

class DocumentChunkResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    chunk_index: int
    content: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


