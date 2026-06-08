import logging
from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.common.exceptions import AppException
from app.common.responses import error_response, success_response
from app.database.session import get_async_db
from app.modules.auth.api import router as auth_router
from app.modules.chat.api import router as chat_router
from app.modules.documents.api import router as documents_router
from app.modules.documents.collections_api import router as collections_router
from app.modules.documents.settings_api import router as settings_router
from app.modules.documents.notes_api import router as notes_router
from app.modules.documents.workspace_settings_api import router as workspace_settings_router
from app.modules.billing.api import router as billing_router


# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorai-os")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-Grade AI Learning & Productivity Platform",
    version="0.1.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
)

# CORS configurations
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Exception Handlers ---

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handles core application exceptions."""
    logger.error(f"Application exception: {exc.error_code} - {exc.message}")
    return error_response(
        code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles schema validation errors."""
    logger.warning(f"Validation error: {exc.errors()}")
    # Clean up error messages
    error_details = "; ".join([f"{'.'.join(str(p) for p in err['loc'])}: {err['msg']}" for err in exc.errors()])
    return error_response(
        code="VALIDATION_ERROR",
        message=f"Input validation failed: {error_details}",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Fallback handler for unhandled exceptions."""
    logger.critical(f"Unhandled server exception: {str(exc)}", exc_info=True)
    return error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred on the server.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

# --- Health & Readiness Endpoints ---

@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_async_db)):
    """Verifies backend database connectivity and system status."""
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.error(f"Healthcheck database failure: {str(e)}")

    redis_ok = False
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        await r.ping()
        await r.close()
        redis_ok = True
    except Exception as e:
        logger.error(f"Healthcheck Redis failure: {str(e)}")

    status_code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "success": db_ok,
            "data": {
                "database": "healthy" if db_ok else "unhealthy",
                "redis": "healthy" if redis_ok else "unhealthy"
            },
            "message": "System is healthy" if db_ok else "Database connectivity is offline"
        }
    )

@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Liveness check probe."""
    return success_response(message="Application is ready")

# --- Routes Registration ---
app.include_router(auth_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(collections_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(notes_router, prefix="/api/v1")
app.include_router(workspace_settings_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")

