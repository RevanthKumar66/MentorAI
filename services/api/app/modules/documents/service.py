import uuid
import hashlib
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.storage.factory import StorageProviderFactory
from app.modules.documents.repository import DocumentRepository
from app.modules.usage.repository import UsageRepository
from app.services.file_validation import validate_file, sanitize_filename
from app.models.document import Document

class DocumentService:
    """Service class coordinating document storage, metadata, scanning, and auditing."""

    def __init__(self, repo: DocumentRepository, db: AsyncSession):
        self.repo = repo
        self.db = db
        self.storage = StorageProviderFactory.get_provider()
        self.usage_repo = UsageRepository(db)

    def scan_file(self, file_content: bytes) -> bool:
        """Architecture hook for virus and malware scanning.
        
        Currently returns True (stub implementation).
        """
        # Future: ClamAV / Cloud scan integrations
        return True

    async def upload_document(
        self,
        user_id: uuid.UUID,
        file_name: str,
        file_content: bytes,
        mime_type: str
    ) -> Document:
        """Validates, scans, checks for duplicates, uploads to storage, and logs in DB."""
        file_size = len(file_content)
        
        # 1. Validate file format and size
        is_valid, err, category = validate_file(file_name, file_size, mime_type)
        if not is_valid:
            raise ValueError(err)

        # 2. Compute checksum
        checksum = hashlib.sha256(file_content).hexdigest()

        # 3. Check for duplicates
        existing = await self.repo.get_document_by_checksum(checksum, user_id)
        if existing:
            raise ValueError(f"Duplicate file detected. This file has already been uploaded as '{existing.original_file_name}' (ID: {existing.id}).")

        # 4. Malware scan hook
        if not self.scan_file(file_content):
            raise ValueError("Malware scan failed. File rejected.")

        # 5. Check if bucket exists
        bucket_name = "documents"
        bucket_exists = await self.storage.check_bucket_exists(bucket_name)
        if not bucket_exists:
            raise RuntimeError(f"Storage bucket '{bucket_name}' does not exist on the provider. Please provision it before uploading.")

        # 6. Upload to storage
        doc_id = uuid.uuid4()
        sanitized_name = sanitize_filename(file_name)
        storage_path = f"documents/{user_id}/{doc_id}/{sanitized_name}"

        try:
            await self.storage.upload_file(
                bucket_name=bucket_name,
                storage_path=storage_path,
                file_content=file_content,
                mime_type=mime_type
            )
        except Exception as e:
            raise RuntimeError(f"Failed to upload file content to storage: {str(e)}")

        # 7. Persist metadata in database (with fallback cleanup)
        try:
            file_extension = sanitized_name.rsplit(".", 1)[-1].lower() if "." in sanitized_name else ""
            
            doc = await self.repo.create_document(
                user_id=user_id,
                file_name=sanitized_name,
                original_file_name=file_name,
                file_extension=file_extension,
                mime_type=mime_type,
                file_size=file_size,
                storage_path=storage_path,
                storage_provider=settings.STORAGE_PROVIDER,
                checksum=checksum,
                category=category,
                document_metadata={"mime_type": mime_type},
                parent_document_id=None,
                version=1
            )

            # Audit log entry
            await self.usage_repo.log_usage(
                user_id=user_id,
                provider="storage",
                model="uploaded",
                input_tokens=file_size,
                output_tokens=0,
                latency_ms=0,
                cost=0.0
            )

            return doc
        except Exception as e:
            # Cleanup storage upload to prevent orphans
            try:
                await self.storage.delete_file(bucket_name, storage_path)
            except Exception:
                pass
            raise e

    async def get_download_url(
        self,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        expires_in: int = 3600
    ) -> str:
        """Retrieves document, checks existence, creates signed download link, and audits."""
        doc = await self.repo.get_document(document_id, user_id)
        if not doc:
            raise ValueError("Document not found or access denied.")

        bucket_name = "documents"
        
        # Verify bucket exists
        bucket_exists = await self.storage.check_bucket_exists(bucket_name)
        if not bucket_exists:
            raise RuntimeError(f"Storage bucket '{bucket_name}' is not provisioned.")

        # Generate signed URL
        try:
            url = await self.storage.generate_signed_url(
                bucket_name=bucket_name,
                storage_path=doc.storage_path,
                expires_in=expires_in
            )
        except Exception as e:
            raise RuntimeError(f"Failed to generate signed url: {str(e)}")

        if not url:
            raise RuntimeError("Signed URL generation returned empty value.")

        # Audit log entry
        await self.usage_repo.log_usage(
            user_id=user_id,
            provider="storage",
            model="downloaded",
            input_tokens=doc.file_size,
            output_tokens=0,
            latency_ms=0,
            cost=0.0
        )

        return url

    async def delete_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Deletes file from storage, marks DB metadata as soft-deleted, and audits."""
        doc = await self.repo.get_document(document_id, user_id)
        if not doc:
            raise ValueError("Document not found or access denied.")

        bucket_name = "documents"

        # 1. Delete from storage provider
        try:
            storage_deleted = await self.storage.delete_file(bucket_name, doc.storage_path)
        except Exception as e:
            raise RuntimeError(f"Failed to delete file from storage: {str(e)}")

        # 2. Mark database record as soft deleted
        db_deleted = await self.repo.soft_delete_document(document_id, user_id)
        if not db_deleted:
            raise RuntimeError("Failed to mark document as soft deleted in database.")

        # 3. Audit log entry
        await self.usage_repo.log_usage(
            user_id=user_id,
            provider="storage",
            model="deleted",
            input_tokens=doc.file_size,
            output_tokens=0,
            latency_ms=0,
            cost=0.0
        )

        return True
