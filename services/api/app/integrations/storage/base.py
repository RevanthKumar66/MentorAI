from abc import ABC, abstractmethod

class BaseStorageProvider(ABC):
    """Abstract base class representing storage provider interactions."""

    @abstractmethod
    async def upload_file(self, bucket_name: str, storage_path: str, file_content: bytes, mime_type: str) -> str:
        """Uploads a file to storage and returns the storage path/identifier."""
        pass

    @abstractmethod
    async def download_file(self, bucket_name: str, storage_path: str) -> bytes:
        """Downloads a file's content from storage."""
        pass

    @abstractmethod
    async def delete_file(self, bucket_name: str, storage_path: str) -> bool:
        """Deletes a file from storage."""
        pass

    @abstractmethod
    async def generate_signed_url(self, bucket_name: str, storage_path: str, expires_in: int = 3600) -> str:
        """Generates a secure temporary download URL for the file."""
        pass

    @abstractmethod
    async def file_exists(self, bucket_name: str, storage_path: str) -> bool:
        """Checks if a file exists in the storage bucket."""
        pass

    @abstractmethod
    async def check_bucket_exists(self, bucket_name: str) -> bool:
        """Checks if the bucket exists and is accessible."""
        pass
