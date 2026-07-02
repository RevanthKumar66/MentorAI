from typing import Optional
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application Settings configuration using Pydantic Settings.
    
    Reads from .env file at application start and throws errors
    if required variables are missing or incorrectly typed.
    """
    model_config = SettingsConfigDict(
        env_file=[
            ".env",
            str(Path(__file__).resolve().parent.parent.parent / ".env")
        ],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = Field(default="MentorAI OS")
    ENV: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    # Database Settings (asyncpg driver connection string)
    DATABASE_URL: str

    @property
    def async_database_url(self) -> str:
        """Helper to ensure PostgreSQL connection uses the asyncpg driver."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            # Heroku/other platforms use postgres:// by default
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    # Supabase configurations
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    # Storage Settings
    STORAGE_PROVIDER: str = Field(default="supabase")

    # JWT Authentication settings
    JWT_ALGORITHM: str = Field(default="RS256")

    # Redis configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # LLM Settings
    GEMINI_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = Field(default="gemini")
    OPENROUTER_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    HF_API_KEY: Optional[str] = None  # HuggingFace Inference API token (hf_xxx)

    # Email Notifications
    RESEND_API_KEY: Optional[str] = None
    NEXT_PUBLIC_APP_URL: str = Field(default="http://localhost:3000")

    # Google OAuth credentials for Workspace/Calendar refresh
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

# Initialize settings singleton
settings = Settings()
