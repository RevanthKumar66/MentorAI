import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, status, File, UploadFile, Query, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_async_db
from app.models.user import User
from app.models.chat import ChatSession
from app.models.document_chunk import DocumentChunk
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.service import DocumentService
from app.modules.documents.schemas import (
    DocumentResponse,
    DocumentDownloadResponse,
    DocumentListResponse,
    DocumentChunkResponse
)

logger = logging.getLogger("mentorai-os.documents.api")

async def process_document_background(document_id: uuid.UUID, user_id: uuid.UUID):
    """Background task to run RAG indexing for a newly uploaded document."""
    from app.database.session import get_async_db
    from app.services.rag_service import RAGService
    try:
        async for db in get_async_db():
            rag = RAGService(db)
            await rag.index_document(document_id, user_id)
            break
    except Exception as e:
        logger.error(f"Background task failed for document {document_id}: {e}", exc_info=True)

router = APIRouter(prefix="/documents", tags=["Documents"])

def get_document_service(db: AsyncSession = Depends(get_async_db)) -> DocumentService:
    repo = DocumentRepository(db)
    return DocumentService(repo, db)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: DocumentService = Depends(get_document_service)
):
    """Uploads a file to storage and saves document metadata."""
    try:
        content = await file.read()
        doc = await service.upload_document(
            user_id=current_user.id,
            file_name=file.filename or "unnamed",
            file_content=content,
            mime_type=file.content_type or "application/octet-stream"
        )
        
        # We need to commit the transaction because we are adding a row.
        # But wait! In FastAPI FastAPI dependencies, does get_async_db automatically commit?
        # Let's verify how session commit is managed in other routers (e.g. chat).
        # In chat.py, db.commit() is usually called by the service, or we call db.commit() here or inside the service.
        # Let's commit inside the service or here. Let's commit in the API handler to ensure clean transactional boundary.
        await service.db.commit()
        await service.db.refresh(doc)

        # Trigger background RAG indexing
        background_tasks.add_task(process_document_background, doc.id, current_user.id)

        data = DocumentResponse.model_validate(doc)
        return success_response(
            data=data.model_dump(),
            message="File uploaded successfully",
            status_code=status.HTTP_201_CREATED
        )
    except ValueError as e:
        await service.db.rollback()
        if "Duplicate file" in str(e):
            return error_response(
                code="DUPLICATE_FILE",
                message=str(e),
                status_code=status.HTTP_409_CONFLICT
            )
        return error_response(
            code="VALIDATION_ERROR",
            message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        await service.db.rollback()
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        return error_response(
            code="UPLOAD_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("")
async def list_documents(
    category: Optional[str] = Query(None, description="Filter documents by category"),
    search: Optional[str] = Query(None, description="Search by file name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    service: DocumentService = Depends(get_document_service)
):
    """Retrieve all active documents for the authenticated user, optionally filtered."""
    try:
        items, total = await service.repo.list_documents(
            user_id=current_user.id,
            category=category,
            search_query=search,
            page=page,
            limit=limit
        )
        
        serialized_items = [DocumentResponse.model_validate(item).model_dump() for item in items]
        list_data = DocumentListResponse(
            items=[DocumentResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            limit=limit
        )
        
        return success_response(
            data={
                "items": serialized_items,
                "total": total,
                "page": page,
                "limit": limit
            },
            message="Documents list retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        return error_response(
            code="LIST_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/{document_id}")
async def get_document_details(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: DocumentService = Depends(get_document_service)
):
    """Retrieve metadata details of a specific document."""
    try:
        doc = await service.repo.get_document(document_id, current_user.id)
        if not doc:
            return error_response(
                code="NOT_FOUND",
                message="Document not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        data = DocumentResponse.model_validate(doc)
        return success_response(
            data=data.model_dump(),
            message="Document details retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error fetching document details: {str(e)}", exc_info=True)
        return error_response(
            code="FETCH_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/{document_id}/download")
async def get_document_download_url(
    document_id: uuid.UUID,
    expires_in: int = Query(3600, ge=60, le=86400, description="Signed URL expiration in seconds"),
    current_user: User = Depends(get_current_user),
    service: DocumentService = Depends(get_document_service)
):
    """Generate a secure signed URL to download/view the document."""
    try:
        download_url = await service.get_download_url(
            document_id=document_id,
            user_id=current_user.id,
            expires_in=expires_in
        )
        
        # Commit to save any download auditing changes
        await service.db.commit()

        data = DocumentDownloadResponse(download_url=download_url, expires_in=expires_in)
        return success_response(
            data=data.model_dump(),
            message="Signed download URL generated successfully"
        )
    except ValueError as e:
        await service.db.rollback()
        return error_response(
            code="NOT_FOUND",
            message=str(e),
            status_code=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        await service.db.rollback()
        logger.error(f"Error generating download URL: {str(e)}", exc_info=True)
        return error_response(
            code="DOWNLOAD_URL_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: DocumentService = Depends(get_document_service)
):
    """Delete a specific document (removes from storage, soft deletes from database)."""
    try:
        await service.delete_document(document_id=document_id, user_id=current_user.id)
        
        # Commit deletion changes
        await service.db.commit()

        return success_response(
            message="Document deleted successfully"
        )
    except ValueError as e:
        await service.db.rollback()
        return error_response(
            code="NOT_FOUND",
            message=str(e),
            status_code=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        await service.db.rollback()
        logger.error(f"Error deleting document: {str(e)}", exc_info=True)
        return error_response(
            code="DELETE_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: DocumentService = Depends(get_document_service)
):
    """Retrieve indexed chunks of a specific document."""
    try:
        # First verify the document exists and belongs to the user
        doc = await service.repo.get_document(document_id, current_user.id)
        if not doc:
            return error_response(
                code="NOT_FOUND",
                message="Document not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Load chunks from the document
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
        res = await service.db.execute(stmt)
        chunks = res.scalars().all()
        
        serialized_chunks = [DocumentChunkResponse.model_validate(c).model_dump() for c in chunks]
        
        return success_response(
            data=serialized_chunks,
            message="Document chunks retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error fetching document chunks: {str(e)}", exc_info=True)
        return error_response(
            code="FETCH_CHUNKS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
