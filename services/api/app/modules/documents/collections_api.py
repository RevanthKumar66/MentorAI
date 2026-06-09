import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, insert, func
from sqlalchemy.orm import selectinload

from app.database.session import get_async_db
from app.models.user import User
from app.models.collection import Collection, collection_documents
from app.models.document import Document
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.modules.documents.schemas import (
    CollectionCreate,
    CollectionResponse,
    CollectionDetailResponse,
    CollectionUpdate,
    NoteCreate,
    NoteResponse
)


logger = logging.getLogger("mentorai-os.collections.api")

router = APIRouter(prefix="/collections", tags=["Collections"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_collection(
    payload: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Creates a new document collection for the user."""
    try:
        col = Collection(
            user_id=current_user.id,
            name=payload.name,
            description=payload.description
        )
        db.add(col)
        await db.commit()
        await db.refresh(col)
        
        data = CollectionResponse.model_validate(col)
        return success_response(
            data=data.model_dump(),
            message="Collection created successfully",
            status_code=status.HTTP_201_CREATED
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating collection: {str(e)}", exc_info=True)
        return error_response(
            code="CREATE_COLLECTION_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("")
async def list_collections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve all collections belonging to the authenticated user."""
    try:
        stmt = (
            select(Collection)
            .options(selectinload(Collection.documents))
            .where(Collection.user_id == current_user.id, Collection.is_deleted == False)
            .order_by(Collection.created_at.desc())
        )
        result = await db.execute(stmt)
        cols = result.scalars().all()
        data = [CollectionResponse.model_validate(c).model_dump() for c in cols]
        return success_response(
            data=data,
            message="Collections retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error listing collections: {str(e)}", exc_info=True)
        return error_response(
            code="LIST_COLLECTIONS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/{collection_id}")
async def get_collection_details(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve details and nested documents of a collection."""
    try:
        stmt = (
            select(Collection)
            .options(
                selectinload(Collection.documents),
                selectinload(Collection.chats)
            )
            .where(
                Collection.id == collection_id,
                Collection.user_id == current_user.id,
                Collection.is_deleted == False
            )
        )
        result = await db.execute(stmt)
        col = result.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Filter out soft-deleted documents & chats
        active_docs = [d for d in col.documents if not d.is_deleted]
        active_chats = [c for c in col.chats if not c.is_deleted]
        
        # Build schema details
        data = CollectionDetailResponse.model_validate(col)
        # Update documents and chats list to only include active ones
        data.documents = [d for d in data.documents if d.id in [ad.id for ad in active_docs]]
        data.chats = [c for c in data.chats if c.id in [ac.id for ac in active_chats]]

        return success_response(
            data=data.model_dump(),
            message="Collection details retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error fetching collection: {str(e)}", exc_info=True)
        return error_response(
            code="FETCH_COLLECTION_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Soft deletes a collection."""
    try:
        stmt = (
            select(Collection)
            .where(
                Collection.id == collection_id,
                Collection.user_id == current_user.id,
                Collection.is_deleted == False
            )
        )
        result = await db.execute(stmt)
        col = result.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        col.is_deleted = True
        col.deleted_at = func.now()
        await db.commit()
        return success_response(
            message="Collection deleted successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting collection: {str(e)}", exc_info=True)
        return error_response(
            code="DELETE_COLLECTION_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/{collection_id}/documents")
async def add_document_to_collection(
    collection_id: uuid.UUID,
    document_ids: List[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Adds multiple documents to a collection."""
    try:
        # 1. Verify collection ownership
        stmt = select(Collection).where(
            Collection.id == collection_id,
            Collection.user_id == current_user.id,
            Collection.is_deleted == False
        )
        col_res = await db.execute(stmt)
        col = col_res.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # 2. Add each document connection (if they belong to the user and aren't already added)
        for doc_id in document_ids:
            # Verify document belongs to user
            doc_stmt = select(Document).where(
                Document.id == doc_id,
                Document.user_id == current_user.id,
                Document.is_deleted == False
            )
            doc_res = await db.execute(doc_stmt)
            doc = doc_res.scalar_one_or_none()
            if not doc:
                continue # Skip invalid documents
            
            # Check if relationship already exists
            exist_stmt = select(collection_documents).where(
                collection_documents.c.collection_id == collection_id,
                collection_documents.c.document_id == doc_id
            )
            exist_res = await db.execute(exist_stmt)
            if exist_res.first():
                continue # Already in collection
            
            # Insert association
            await db.execute(
                insert(collection_documents).values(
                    collection_id=collection_id,
                    document_id=doc_id
                )
            )
        
        await db.commit()
        return success_response(
            message="Documents added to collection successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error adding documents to collection: {str(e)}", exc_info=True)
        return error_response(
            code="ADD_DOCUMENTS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/{collection_id}/documents/{document_id}")
async def remove_document_from_collection(
    collection_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Removes a document from a collection."""
    try:
        # Verify collection ownership
        stmt = select(Collection).where(
            Collection.id == collection_id,
            Collection.user_id == current_user.id,
            Collection.is_deleted == False
        )
        col_res = await db.execute(stmt)
        col = col_res.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Delete association
        del_stmt = delete(collection_documents).where(
            collection_documents.c.collection_id == collection_id,
            collection_documents.c.document_id == document_id
        )
        res = await db.execute(del_stmt)
        await db.commit()
        
        if res.rowcount == 0:
            return error_response(
                code="NOT_FOUND",
                message="Document was not in this collection.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            message="Document removed from collection successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error removing document: {str(e)}", exc_info=True)
        return error_response(
            code="REMOVE_DOCUMENT_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.patch("/{collection_id}")
async def update_collection(
    collection_id: uuid.UUID,
    payload: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update name, description, color, or icon of a collection."""
    try:
        stmt = select(Collection).where(
            Collection.id == collection_id,
            Collection.user_id == current_user.id,
            Collection.is_deleted == False
        )
        res = await db.execute(stmt)
        col = res.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        if payload.name is not None:
            col.name = payload.name
        if payload.description is not None:
            col.description = payload.description
        if payload.color is not None:
            col.color = payload.color
        if payload.icon is not None:
            col.icon = payload.icon
            
        await db.commit()
        await db.refresh(col)
        
        data = CollectionResponse.model_validate(col)
        return success_response(
            data=data.model_dump(),
            message="Collection updated successfully"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating collection: {str(e)}", exc_info=True)
        return error_response(
            code="UPDATE_COLLECTION_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/{collection_id}/chats")
async def attach_chat(
    collection_id: uuid.UUID,
    chat_payload: dict,  # {"chat_session_id": "UUID"}
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Link a chat session to a collection/workspace."""
    try:
        chat_session_id_str = chat_payload.get("chat_session_id")
        if not chat_session_id_str:
            return error_response(
                code="BAD_REQUEST",
                message="chat_session_id is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        chat_session_id = uuid.UUID(chat_session_id_str)
        
        # Verify collection ownership
        stmt = select(Collection).where(
            Collection.id == collection_id,
            Collection.user_id == current_user.id,
            Collection.is_deleted == False
        )
        col_res = await db.execute(stmt)
        col = col_res.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Verify chat ownership
        from app.models.chat import ChatSession, ChatMessage
        from app.models.collection import collection_chats
        chat_stmt = select(ChatSession).where(
            ChatSession.id == chat_session_id,
            ChatSession.user_id == current_user.id,
            ChatSession.is_deleted == False
        )
        chat_res = await db.execute(chat_stmt)
        chat = chat_res.scalar_one_or_none()
        if not chat:
            return error_response(
                code="NOT_FOUND",
                message="Chat session not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Check if already linked
        exist_stmt = select(collection_chats).where(
            collection_chats.c.collection_id == collection_id,
            collection_chats.c.chat_session_id == chat_session_id
        )
        exist_res = await db.execute(exist_stmt)
        if exist_res.first():
            return success_response(message="Chat session already linked to workspace")

        # Insert relationship
        await db.execute(
            insert(collection_chats).values(
                collection_id=collection_id,
                chat_session_id=chat_session_id
            )
        )
        await db.commit()
        return success_response(message="Chat session linked to workspace successfully")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error linking chat to collection: {str(e)}", exc_info=True)
        return error_response(
            code="LINK_CHAT_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/{collection_id}/chats/{chat_session_id}")
async def detach_chat(
    collection_id: uuid.UUID,
    chat_session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Unlink a chat session from a collection/workspace."""
    try:
        # Verify collection ownership
        stmt = select(Collection).where(
            Collection.id == collection_id,
            Collection.user_id == current_user.id,
            Collection.is_deleted == False
        )
        col_res = await db.execute(stmt)
        col = col_res.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        from app.models.collection import collection_chats
        del_stmt = delete(collection_chats).where(
            collection_chats.c.collection_id == collection_id,
            collection_chats.c.chat_session_id == chat_session_id
        )
        res = await db.execute(del_stmt)
        await db.commit()
        
        if res.rowcount == 0:
            return error_response(
                code="NOT_FOUND",
                message="Chat was not linked to this collection.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(message="Chat session unlinked from workspace successfully")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error unlinking chat: {str(e)}", exc_info=True)
        return error_response(
            code="UNLINK_CHAT_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/{collection_id}/notes")
async def list_notes(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """List all notes in a collection."""
    try:
        from app.models.note import Note
        # Verify collection ownership
        stmt = select(Collection).where(
            Collection.id == collection_id,
            Collection.user_id == current_user.id,
            Collection.is_deleted == False
        )
        col_res = await db.execute(stmt)
        if not col_res.scalar_one_or_none():
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        note_stmt = select(Note).where(
            Note.collection_id == collection_id,
            Note.user_id == current_user.id,
            Note.is_deleted == False
        ).order_by(Note.updated_at.desc())
        
        note_res = await db.execute(note_stmt)
        notes = note_res.scalars().all()
        data = [NoteResponse.model_validate(n).model_dump() for n in notes]
        
        return success_response(
            data=data,
            message="Notes retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error listing notes: {str(e)}", exc_info=True)
        return error_response(
            code="LIST_NOTES_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/{collection_id}/notes")
async def create_note(
    collection_id: uuid.UUID,
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new note inside a collection."""
    try:
        from app.models.note import Note
        # Verify collection ownership
        stmt = select(Collection).where(
            Collection.id == collection_id,
            Collection.user_id == current_user.id,
            Collection.is_deleted == False
        )
        col_res = await db.execute(stmt)
        if not col_res.scalar_one_or_none():
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        note = Note(
            collection_id=collection_id,
            user_id=current_user.id,
            title=payload.title or "Untitled Note",
            content=payload.content or ""
        )
        db.add(note)
        await db.commit()
        await db.refresh(note)
        
        data = NoteResponse.model_validate(note)
        return success_response(
            data=data.model_dump(),
            message="Note created successfully",
            status_code=status.HTTP_201_CREATED
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating note: {str(e)}", exc_info=True)
        return error_response(
            code="CREATE_NOTE_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/{collection_id}/insights")
async def get_insights(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Generates learning topics, entities, terms, and knowledge summary from workspace documents."""
    try:
        # 1. Fetch collection details and active documents
        stmt = (
            select(Collection)
            .options(selectinload(Collection.documents))
            .where(
                Collection.id == collection_id,
                Collection.user_id == current_user.id,
                Collection.is_deleted == False
            )
        )
        res = await db.execute(stmt)
        col = res.scalar_one_or_none()
        if not col:
            return error_response(
                code="NOT_FOUND",
                message="Collection not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        active_docs = [d for d in col.documents if not d.is_deleted and d.is_processed]
        if not active_docs:
            return success_response(
                data={
                    "summary": "This workspace is currently empty. Upload documents or create notes to generate AI insights.",
                    "topics": [],
                    "keywords": [],
                    "concepts": [],
                    "document_count": 0
                },
                message="Empty insights returned"
            )

        # 2. Extract some sample text from indexed chunks to summarize
        from app.models.document_chunk import DocumentChunk
        doc_ids = [d.id for d in active_docs]
        chunks_stmt = select(DocumentChunk.content).where(
            DocumentChunk.document_id.in_(doc_ids)
        ).limit(10)
        chunks_res = await db.execute(chunks_stmt)
        sample_texts = [row[0] for row in chunks_res.all()]
        corpus = "\n\n".join(sample_texts)[:6000]

        # 3. Call Gemini via LLMProviderFactory to generate structured insights
        from app.llm.providers.factory import LLMProviderFactory
        provider = LLMProviderFactory.get_provider()
        prompt = (
            "Analyze the following textual corpus representing the user's personal knowledge base workspace. "
            "Generate a structured JSON output with the following exact keys:\n"
            "1. 'summary': A high-level 2-3 sentence summary of the primary knowledge domains and topics represented in this corpus.\n"
            "2. 'topics': A list of the top 3-5 primary topics or disciplines covered in the files.\n"
            "3. 'keywords': A list of the top 5-8 frequently mentioned terminology or technical concepts.\n"
            "4. 'concepts': A list of 3-4 key core principles or learning areas explained in the corpus.\n\n"
            f"Corpus:\n{corpus}\n\n"
            "Ensure the response is strict valid JSON with no backticks, no code block formatting, just the raw JSON."
        )

        insights = {
            "summary": "AI is extracting and generating concept summaries from your workspace documents...",
            "topics": [d.original_file_name.split('.')[0] for d in active_docs[:4]],
            "keywords": ["Knowledge Base", "Workspace", "RAG Chunks"],
            "concepts": ["Interactive Learning"],
            "document_count": len(active_docs)
        }

        try:
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.5-flash",
                temperature=0.3
            )
            text_resp = res_llm.get("text", "").strip()
            # Clean JSON formatting
            if "```" in text_resp:
                text_resp = text_resp.split("```")[1]
                if text_resp.startswith("json"):
                    text_resp = text_resp[4:].strip()
            
            parsed = json.loads(text_resp)
            if isinstance(parsed, dict):
                insights["summary"] = parsed.get("summary", insights["summary"])
                insights["topics"] = parsed.get("topics", insights["topics"])
                insights["keywords"] = parsed.get("keywords", insights["keywords"])
                insights["concepts"] = parsed.get("concepts", insights["concepts"])
        except Exception as llm_err:
            logger.warning(f"Failed to generate custom insights via Gemini: {llm_err}. Using fallback metadata.")

        return success_response(
            data=insights,
            message="Workspace insights generated successfully"
        )
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}", exc_info=True)
        return error_response(
            code="GET_INSIGHTS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

