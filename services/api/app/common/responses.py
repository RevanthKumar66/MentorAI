from typing import Any, Optional
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def success_response(
    data: Any = None, 
    message: Optional[str] = None, 
    status_code: int = 200
) -> JSONResponse:
    """Standard success API response wrapper."""
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder({
            "success": True,
            "data": data if data is not None else {},
            "message": message or "Success"
        })
    )

def error_response(
    code: str, 
    message: str, 
    status_code: int = 400
) -> JSONResponse:
    """Standard error API response wrapper."""
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder({
            "success": False,
            "error": {
                "code": code,
                "message": message
            }
        })
    )
