from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar('T')

class PageParams(BaseModel):
    """Paging input query parameters."""
    page: int = Field(default=1, ge=1, description="Page number, 1-indexed")
    size: int = Field(default=20, ge=1, le=100, description="Page size")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size

class Page(BaseModel, Generic[T]):
    """Standard paginated output envelope."""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
