import asyncio
import uuid
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.chat.repository import ChatRepository
from app.modules.chat.schemas import ChatSessionDetailResponse

async def check():
    engine = create_async_engine(settings.async_database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    user_id = uuid.UUID("3e796982-93b1-40a0-9e0d-c410d676db8b") # revanthnice1432
    session_id = uuid.UUID("71304150-ddaf-4a5e-af33-19dc827406b5") # Define AI
    
    async with async_session() as db:
        repo = ChatRepository(db)
        try:
            session = await repo.get_session_with_messages(session_id, user_id)
            if not session:
                print("Session not found!")
                return
            
            print("Session found:", session.title)
            print("Session messages relation length in model:", len(session.messages))
            
            # Try serializing with Pydantic
            serialized = ChatSessionDetailResponse.model_validate(session)
            dumped = serialized.model_dump()
            print("Successfully serialized with Pydantic!")
            print("Serialized messages count:", len(dumped["messages"]))
            for msg in dumped["messages"]:
                print(f"  Role: {msg['role']} | Content: {msg['content'][:30]}...")
        except Exception as e:
            print("ERROR IN GET_SESSION_DETAILS / SERIALIZATION:")
            import traceback
            traceback.print_exc()
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
