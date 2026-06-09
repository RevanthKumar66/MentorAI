import asyncio
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine(settings.async_database_url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, session_id, role, LEFT(content, 30) as preview, is_deleted FROM chat_messages"))
        msgs = res.fetchall()
        print(f"--- Chat Messages in PG (Total: {len(msgs)}) ---")
        for m in msgs:
            print(f"Msg ID: {m.id} | Session ID: {m.session_id} | Role: {m.role} | Content: {m.preview}... | Deleted: {m.is_deleted}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
