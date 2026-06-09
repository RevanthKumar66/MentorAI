import json
import logging
import uuid
from typing import List, Optional
from sqlalchemy import select, delete

from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.collection import Collection, collection_documents
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger("mentorai-os.services.rag_service")

class RAGService:
    """Service to coordinate Retrieval-Augmented Generation processes: indexing and querying."""

    def __init__(self, db):
        self.db = db
        self.chunk_service = ChunkingService()
        self.embedding_service = EmbeddingService()

    async def index_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Downloads, parses, chunks, generates embeddings, and indexes a Document in DB."""
        stmt = select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id,
            Document.is_deleted == False
        )
        res = await self.db.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            logger.error(f"Document {document_id} not found or unauthorized for user {user_id}")
            return False

        # Set status to processing
        doc.processing_status = "processing"
        await self.db.flush()

        try:
            # 1. Download file content from storage provider
            from app.integrations.storage.factory import StorageProviderFactory
            storage = StorageProviderFactory.get_provider()
            content = await storage.download_file("documents", doc.storage_path)

            # 2. Extract plain text
            text = self.chunk_service.extract_text(content, doc.file_extension, doc.mime_type)
            if not text.strip():
                raise ValueError("No extractable text content found in document")

            # 3. Generate overlapping chunks
            chunks = self.chunk_service.split_text(text)
            if not chunks:
                raise ValueError("Text splitting returned zero chunks")

            # 4. Generate embeddings
            embeddings = await self.embedding_service.get_embeddings(chunks)
            if len(embeddings) != len(chunks):
                raise ValueError(f"Embedding count mismatch. Generated {len(embeddings)} for {len(chunks)} chunks.")

            # 5. Delete old chunks if any exist (re-indexing support)
            del_stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
            await self.db.execute(del_stmt)

            # 6. Save chunks and embeddings (always PostgreSQL pgvector)
            for idx, (chunk_text, emb) in enumerate(zip(chunks, embeddings)):
                new_chunk = DocumentChunk(
                    document_id=document_id,
                    chunk_index=idx,
                    content=chunk_text,
                    embedding=emb
                )
                self.db.add(new_chunk)

            # 7. Update status to completed
            doc.is_processed = True
            doc.processing_status = "completed"
            doc.processing_error = None
            await self.db.flush()
            logger.info(f"Successfully indexed document {document_id} into {len(chunks)} chunks.")
            return True
            
        except Exception as e:
            logger.error(f"Failed to process and index document {document_id}: {e}", exc_info=True)
            doc.processing_status = "failed"
            doc.processing_error = str(e)
            await self.db.flush()
            return False

    async def get_similar_chunks(
        self,
        user_id: uuid.UUID,
        query: str,
        document_ids: Optional[List[uuid.UUID]] = None,
        collection_ids: Optional[List[uuid.UUID]] = None,
        k: int = 5
    ) -> List[dict]:
        """Retrieves top-k similar document chunks matching the query string.
        
        Supports filtering by specific documents or document collections.
        Automatically falls back to NumPy cosine similarity on SQLite.
        """
        # 1. Generate query embedding
        query_vector = await self.embedding_service.get_embedding(query)
        if not query_vector:
            return []

        # 2. Get active document IDs filtered by collections/ids
        doc_stmt = select(Document.id).where(
            Document.user_id == user_id,
            Document.is_deleted == False,
            Document.is_processed == True
        )
        
        if collection_ids:
            col_doc_stmt = select(collection_documents.c.document_id).join(
                Collection, Collection.id == collection_documents.c.collection_id
            ).where(
                Collection.id.in_(collection_ids),
                Collection.user_id == user_id,
                Collection.is_deleted == False
            )
            col_res = await self.db.execute(col_doc_stmt)
            col_doc_ids = [row[0] for row in col_res.all()]
            
            if document_ids:
                allowed_ids = list(set(document_ids).intersection(set(col_doc_ids)))
            else:
                allowed_ids = col_doc_ids
                
            if not allowed_ids:
                return []
            doc_stmt = doc_stmt.where(Document.id.in_(allowed_ids))
        elif document_ids:
            doc_stmt = doc_stmt.where(Document.id.in_(document_ids))
            
        doc_res = await self.db.execute(doc_stmt)
        active_doc_ids = [row[0] for row in doc_res.all()]
        
        if not active_doc_ids:
            return []

        # 3. Perform native PostgreSQL pgvector cosine similarity matching
        # pgvector's cosine_distance is 1 - cosine_similarity. Sort ascending.
        stmt = select(
            DocumentChunk,
            Document.original_file_name,
            DocumentChunk.embedding.cosine_distance(query_vector).label("distance")
        ).join(
            Document, Document.id == DocumentChunk.document_id
        ).where(
            DocumentChunk.document_id.in_(active_doc_ids)
        ).order_by(
            "distance"
        ).limit(k)
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        similar_chunks = []
        for chunk, file_name, dist in rows:
            score = 1.0 - float(dist) if dist is not None else 0.0
            similar_chunks.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "file_name": file_name,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "score": score
            })
        return similar_chunks
