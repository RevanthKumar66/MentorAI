from app.common.exceptions import AppException
from fastapi import status

class LLMProviderException(AppException):
    """Exception thrown when LLM provider operations fail."""
    status_code: int = status.HTTP_502_BAD_GATEWAY
    error_code: str = "LLM_PROVIDER_ERROR"
    message: str = "LLM provider failed to generate content."
