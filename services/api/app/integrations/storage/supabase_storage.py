import asyncio
import os
from app.integrations.supabase.client import get_supabase_client
from app.integrations.storage.base import BaseStorageProvider

class SupabaseStorageProvider(BaseStorageProvider):
    """Supabase Storage Adapter implementing BaseStorageProvider interface."""

    def __init__(self):
        self.client = get_supabase_client()

    async def upload_file(self, bucket_name: str, storage_path: str, file_content: bytes, mime_type: str) -> str:
        """Uploads a file's raw bytes to Supabase Storage."""
        def _upload():
            return self.client.storage.from_(bucket_name).upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": mime_type}
            )
        await asyncio.to_thread(_upload)
        return storage_path

    async def download_file(self, bucket_name: str, storage_path: str) -> bytes:
        """Downloads file content from Supabase Storage."""
        def _download():
            return self.client.storage.from_(bucket_name).download(storage_path)
        return await asyncio.to_thread(_download)

    async def delete_file(self, bucket_name: str, storage_path: str) -> bool:
        """Deletes a file from Supabase Storage."""
        def _delete():
            self.client.storage.from_(bucket_name).remove([storage_path])
            return True
        try:
            return await asyncio.to_thread(_delete)
        except Exception:
            return False

    async def generate_signed_url(self, bucket_name: str, storage_path: str, expires_in: int = 3600) -> str:
        """Generates a temporary signed download URL."""
        def _signed():
            res = self.client.storage.from_(bucket_name).create_signed_url(storage_path, expires_in=expires_in)
            if isinstance(res, dict):
                return res.get("signedURL") or res.get("url") or ""
            return str(res)
        return await asyncio.to_thread(_signed)

    async def file_exists(self, bucket_name: str, storage_path: str) -> bool:
        """Checks if a file exists inside the Supabase Storage bucket."""
        def _check():
            dir_name = os.path.dirname(storage_path).replace("\\", "/")
            base_name = os.path.basename(storage_path)
            # If dir_name is empty, list root
            items = self.client.storage.from_(bucket_name).list(dir_name or None)
            for item in items:
                if isinstance(item, dict) and item.get("name") == base_name:
                    return True
                elif hasattr(item, "name") and getattr(item, "name") == base_name:
                    return True
            return False
        try:
            return await asyncio.to_thread(_check)
        except Exception:
            return False

    async def check_bucket_exists(self, bucket_name: str) -> bool:
        """Checks if the Supabase Storage bucket exists and is accessible."""
        def _check_bucket():
            try:
                self.client.storage.get_bucket(bucket_name)
                return True
            except Exception:
                return False
        return await asyncio.to_thread(_check_bucket)
