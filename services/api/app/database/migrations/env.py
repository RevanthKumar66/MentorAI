import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import configurations
from app.core.config import settings
from app.database.base import Base

# this is the Alembic Config object
config = context.config

# Set logging config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set DB URL from settings
config.set_main_option("sqlalchemy.url", settings.async_database_url)

# Meta target
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    primary_url = config.get_main_option("sqlalchemy.url")
    use_fallback = False
    
    try:
        connectable = async_engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()
    except Exception as e:
        print(f"Primary database connection failed: {e}. Falling back to SQLite.")
        use_fallback = True

    if use_fallback:
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        fallback_db_path = os.path.join(base_dir, "mentorai.db")
        fallback_db_url = f"sqlite+aiosqlite:///{fallback_db_path}"
        
        config.set_main_option("sqlalchemy.url", fallback_db_url)
        connectable = async_engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
