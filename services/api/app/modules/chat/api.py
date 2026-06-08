import uuid
import logging
from fastapi import APIRouter, Depends, status, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_async_db
from app.models.user import User
from app.models.chat import ChatSession
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.chat.repository import ChatRepository
from app.modules.chat.service import ChatService
from app.modules.chat.schemas import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionDetailResponse,
    ChatMessageSend,
    ChatSessionUpdate
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
        temperature=payload.temperature,
        role=payload.role
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
        service.stream_chat_response(session_id, current_user.id, payload.content, payload.is_retry),
        media_type="text/event-stream"
    )

@router.patch("/sessions/{session_id}")
async def update_chat_session(
    session_id: uuid.UUID,
    payload: ChatSessionUpdate,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Updates metadata of a ChatSession (such as title, role, or temperature)."""
    try:
        session = await service.get_session_details(session_id, current_user.id)
        if not session:
            return error_response(
                code="NOT_FOUND",
                message="Chat session not found or unauthorized",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        if payload.title is not None:
            session.title = payload.title
        if payload.temperature is not None:
            session.temperature = payload.temperature
        if payload.is_archived is not None:
            session.is_archived = payload.is_archived
        if payload.model_name is not None:
            session.model_name = payload.model_name
        
        if payload.role is not None:
            session.role = payload.role
            # Read new system prompt from file matching the role
            prompt_file = f"{payload.role}_prompt.md" if payload.role != "general" else "system.md"
            from app.modules.chat.service import read_prompt
            new_prompt = read_prompt(prompt_file)
            if new_prompt:
                session.system_prompt = new_prompt
                
        await db.commit()
        await db.refresh(session)
        
        data = ChatSessionResponse.model_validate(session)
        return success_response(
            data=data.model_dump(),
            message="Chat session updated successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating chat session: {str(e)}", exc_info=True)
        return error_response(
            code="UPDATE_SESSION_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/workspace/search")
async def workspace_search(
    q: str = Query(..., min_length=1, description="Search term"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Global search for chats, documents, and collections belonging to the user."""
    try:
        from app.models.document import Document
        from app.models.collection import Collection
        from sqlalchemy import or_, select
        from app.modules.documents.schemas import DocumentResponse, CollectionResponse

        # 1. Search Chat sessions
        chat_stmt = (
            select(ChatSession)
            .where(
                ChatSession.user_id == current_user.id,
                ChatSession.is_deleted == False,
                ChatSession.title.ilike(f"%{q}%")
            )
            .limit(10)
        )
        chat_res = await db.execute(chat_stmt)
        chats = chat_res.scalars().all()
        serialized_chats = [ChatSessionResponse.model_validate(c).model_dump() for c in chats]

        # 2. Search Documents
        doc_stmt = (
            select(Document)
            .where(
                Document.user_id == current_user.id,
                Document.is_deleted == False,
                or_(
                    Document.file_name.ilike(f"%{q}%"),
                    Document.original_file_name.ilike(f"%{q}%")
                )
            )
            .limit(10)
        )
        doc_res = await db.execute(doc_stmt)
        docs = doc_res.scalars().all()
        serialized_docs = [DocumentResponse.model_validate(d).model_dump() for d in docs]

        # 3. Search Collections
        col_stmt = (
            select(Collection)
            .where(
                Collection.user_id == current_user.id,
                Collection.is_deleted == False,
                or_(
                    Collection.name.ilike(f"%{q}%"),
                    Collection.description.ilike(f"%{q}%")
                )
            )
            .limit(10)
        )
        col_res = await db.execute(col_stmt)
        cols = col_res.scalars().all()
        serialized_cols = [CollectionResponse.model_validate(c).model_dump() for c in cols]

        return success_response(
            data={
                "chats": serialized_chats,
                "documents": serialized_docs,
                "collections": serialized_cols
            },
            message="Workspace search completed successfully"
        )
    except Exception as e:
        logger.error(f"Error during workspace search: {str(e)}", exc_info=True)
        return error_response(
            code="SEARCH_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
