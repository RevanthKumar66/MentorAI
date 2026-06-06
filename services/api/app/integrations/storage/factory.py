from app.core.config import settings
from app.integrations.storage.base import BaseStorageProvider
from app.integrations.storage.supabase_storage import SupabaseStorageProvider

_storage_provider: BaseStorageProvider = None

class StorageProviderFactory:
    """Factory to instantiate and retrieve the configured storage provider singleton."""

    @staticmethod
    def get_provider() -> BaseStorageProvider:
        global _storage_provider
        if _storage_provider is None:
            provider_type = settings.STORAGE_PROVIDER.lower()
            if provider_type == "supabase":
                _storage_provider = SupabaseStorageProvider()
            else:
                raise ValueError(f"Unsupported storage provider type: {provider_type}")
        return _storage_provider
