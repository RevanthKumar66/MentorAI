from fastapi import status

class AppException(Exception):
    """Base application exception."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "INTERNAL_SERVER_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, error_code: str | None = None, status_code: int | None = None):
        super().__init__(message or self.message)
        if message:
            self.message = message
        if error_code:
            self.error_code = error_code
        if status_code is not None:
            self.status_code = status_code

class AuthException(AppException):
    """Authentication and authorization related exceptions."""
    status_code: int = status.HTTP_401_UNAUTHORIZED
    error_code: str = "UNAUTHORIZED"
    message: str = "Authentication failed or token is invalid."

class PermissionDeniedException(AppException):
    """Permission denied exception."""
    status_code: int = status.HTTP_403_FORBIDDEN
    error_code: str = "FORBIDDEN"
    message: str = "You do not have permission to access this resource."

class NotFoundException(AppException):
    """Resource not found exception."""
    status_code: int = status.HTTP_404_NOT_FOUND
    error_code: str = "NOT_FOUND"
    message: str = "The requested resource was not found."

class ValidationException(AppException):
    """Request validation exception."""
    status_code: int = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code: str = "VALIDATION_ERROR"
    message: str = "Input validation failed."

class DatabaseException(AppException):
    """Database query execution exception."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "DATABASE_ERROR"
    message: str = "A database error occurred."
