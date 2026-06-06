import uuid
import logging
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_async_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.chat.repository import ChatRepository
from app.modules.chat.service import ChatService
from app.modules.chat.schemas import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionDetailResponse,
    ChatMessageSend
)
from app.modules.usage.repository import UsageRepository
from app.modules.usage.service import UsageService

logger = logging.getLogger("mentorai-os.chat.api")

router = APIRouter(prefix="/chat", tags=["Chat"])

def get_chat_service(db: AsyncSession = Depends(get_async_db)) -> ChatService:
    chat_repo = ChatRepository(db)
    usage_repo = UsageRepository(db)
    usage_service = UsageService(usage_repo)
    return ChatService(chat_repo, usage_service, db)

@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    payload: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    """Creates a new ChatSession for the authenticated user."""
    session = await service.create_session(
        user_id=current_user.id,
        title=payload.title,
        model_name=payload.model_name,
        system_prompt=payload.system_prompt,
        temperature=payload.temperature
    )
    
    # Serialize using Pydantic model
    data = ChatSessionResponse.model_validate(session)
    return success_response(
        data=data.model_dump(),
        message="Chat session created successfully",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/sessions")
async def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    """Retrieve all active ChatSessions for the authenticated user."""
    sessions = await service.list_sessions(user_id=current_user.id)
    data = [ChatSessionResponse.model_validate(s).model_dump() for s in sessions]
    return success_response(
        data=data,
        message="Chat sessions retrieved successfully"
    )

@router.get("/sessions/{session_id}")
async def get_chat_session_details(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    """Retrieve full conversation details of a specific ChatSession."""
    session = await service.get_session_details(session_id=session_id, user_id=current_user.id)
    if not session:
        return error_response(
            code="NOT_FOUND",
            message="Chat session not found or unauthorized",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    data = ChatSessionDetailResponse.model_validate(session).model_dump()
    return success_response(
        data=data,
        message="Chat session details retrieved successfully"
    )

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    """Delete a specific ChatSession."""
    deleted = await service.delete_session(session_id=session_id, user_id=current_user.id)
    if not deleted:
        return error_response(
            code="NOT_FOUND",
            message="Chat session not found or unauthorized",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(
        message="Chat session deleted successfully"
    )

@router.post("/sessions/{session_id}/stream")
async def stream_chat(
    session_id: uuid.UUID,
    payload: ChatMessageSend,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    """Streams token-by-token completion from the LLM provider for the session."""
    # Verify ownership before opening stream
    session = await service.get_session_details(session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or unauthorized"
        )
        
    return StreamingResponse(
        service.stream_chat_response(session_id, current_user.id, payload.content),
        media_type="text/event-stream"
    )
