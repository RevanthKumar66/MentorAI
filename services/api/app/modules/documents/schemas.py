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
