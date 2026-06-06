import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.usage.repository import UsageRepository

logger = logging.getLogger("mentorai-os.usage.service")

class UsageService:
    """Service layer class coordinating usage logging telemetry."""

    def __init__(self, repo: UsageRepository):
        self.repo = repo

    def calculate_cost(self, provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
        """Estimate the token cost based on model and provider rates.
        
        Using blended baseline pricing per 1M tokens.
        """
        provider_lower = provider.lower()
        model_lower = model.lower()

        # If Gemini free tier, cost is 0.0
        if "gemini" in provider_lower and "free" in model_lower:
            return 0.0

        # Estimated rate per 1,000,000 tokens
        # Default fallback standard rates
        input_rate = 0.075  # $0.075 / 1M tokens
        output_rate = 0.30  # $0.30 / 1M tokens

        if "gemini-2.5-flash" in model_lower:
            input_rate = 0.075
            output_rate = 0.30
        elif "deepseek" in model_lower:
            # DeepSeek V3 is roughly $0.14 input, $0.28 output
            input_rate = 0.14
            output_rate = 0.28
        elif "llama-3" in model_lower:
            input_rate = 0.20
            output_rate = 0.60
        elif "qwen" in model_lower:
            input_rate = 0.07
            output_rate = 0.20
        elif "ollama" in provider_lower:
            # Local models run for free
            return 0.0

        input_cost = (input_tokens / 1_000_000.0) * input_rate
        output_cost = (output_tokens / 1_000_000.0) * output_rate
        
        return input_cost + output_cost

    async def log_api_usage(
        self,
        user_id: uuid.UUID,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int
    ):
        """Calculates token cost and inserts usage log in the database."""
        try:
            cost = self.calculate_cost(provider, model, input_tokens, output_tokens)
            log = await self.repo.log_usage(
                user_id=user_id,
                provider=provider,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=latency_ms,
                cost=cost
            )
            return log
        except Exception as e:
            # Don't break chat service if usage telemetry logging fails
            logger.error(f"Failed to log API usage: {str(e)}", exc_info=True)
            return None
