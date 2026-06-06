import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.usage import UsageLog

class UsageRepository:
    """Repository class handling data access logic for usage telemetry logs."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_usage(
        self,
        user_id: uuid.UUID,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
        cost: float = 0.0
    ) -> UsageLog:
        """Create a new UsageLog database entry."""
        log = UsageLog(
            user_id=user_id,
            provider=provider,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            cost=cost
        )
        self.db.add(log)
        await self.db.flush()
        return log
