import os
import logging
from typing import AsyncGenerator
from sqlalchemy import text, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
import datetime

logger = logging.getLogger("mentorai-os.database")

# Register 'now' SQL function for SQLite compatibility
@event.listens_for(Engine, "connect")
def register_now_function(dbapi_connection, connection_record):
    if hasattr(dbapi_connection, "create_function"):
        try:
            dbapi_connection.create_function("now", 0, lambda: datetime.datetime.now(datetime.UTC).isoformat())
        except Exception as e:
            logger.error(f"Failed to register now() function on SQLite connection: {e}")

# Create primary PostgreSQL engine
engine = create_async_engine(
    settings.async_database_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True
)

# Async sessionmaker factory
async_session_maker = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# SQLite fallback configuration (absolute path under services/api/mentorai.db)
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
fallback_db_path = os.path.join(base_dir, "mentorai.db")
fallback_db_url = f"sqlite+aiosqlite:///{fallback_db_path}"

fallback_engine = create_async_engine(
    fallback_db_url,
    echo=settings.DEBUG,
    future=True
)

fallback_session_maker = async_sessionmaker(
    fallback_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

_use_fallback = False
_fallback_initialized = False

async def initialize_fallback():
    global _fallback_initialized
    if not _fallback_initialized:
        from app.database.base import Base
        async with fallback_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        _fallback_initialized = True
        logger.info(f"Local SQLite fallback database initialized at: {fallback_db_path}")

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing database sessions to API endpoints, with automatic SQLite fallback."""
    global _use_fallback
    
    if _use_fallback:
        await initialize_fallback()
        async with fallback_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
        return

    # Try using primary PostgreSQL
    async with async_session_maker() as session:
        try:
            # Quick ping to verify PostgreSQL connectivity
            await session.execute(text("SELECT 1"))
            yield session
            await session.commit()
        except Exception as e:
            err_str = str(e).lower()
            # Catch DNS, timeout, or user/tenant not found errors
            if "tenant" in err_str or "connection" in err_str or "timeout" in err_str or "gaierror" in err_str or "not found" in err_str:
                logger.warning(f"PostgreSQL connection failed: {e}. Falling back to local SQLite.")
                _use_fallback = True
                await session.close()
                
                # Switch to SQLite session
                await initialize_fallback()
                async with fallback_session_maker() as fallback_session:
                    try:
                        yield fallback_session
                        await fallback_session.commit()
                    except Exception:
                        await fallback_session.rollback()
                        raise
                    finally:
                        await fallback_session.close()
            else:
                await session.rollback()
                raise
        finally:
            if not _use_fallback:
                await session.close()

