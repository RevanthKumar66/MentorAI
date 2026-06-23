from typing import BinaryIO, Any
from app.integrations.supabase.client import get_supabase_client

class SupabaseStorageHelper:
    """Helper class for interacting with Supabase Storage."""

    def __init__(self):
        self.client = get_supabase_client()

    def upload_file(self, bucket: str, path: str, file_obj: Any, content_type: str) -> Any:
        """Uploads a file to a specified Supabase storage bucket."""
        res = self.client.storage.from_(bucket).upload(
            path=path,
            file=file_obj,
            file_options={"content-type": content_type}
        )
        return res

    def get_public_url(self, bucket: str, path: str) -> str:
        """Retrieves a public URL for a file in a storage bucket."""
        return self.client.storage.from_(bucket).get_public_url(path)

    def download_file(self, bucket: str, path: str) -> bytes:
        """Downloads a file from a storage bucket."""
        return self.client.storage.from_(bucket).download(path)

    def delete_file(self, bucket: str, path: str):
        """Deletes a file from a storage bucket."""
        self.client.storage.from_(bucket).remove([path])
