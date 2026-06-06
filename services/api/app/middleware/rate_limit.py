import logging
import time
from fastapi import Request, HTTPException, status, Depends
import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger("mentorai-os.middleware.rate_limit")

class RateLimiter:
    """Production-grade rate limiting middleware leveraging Redis.
    
    Implements a sliding window log or fixed window counter rate limit.
    Degrades gracefully if Redis is unavailable.
    """
    def __init__(self, limit: int = 60, window: int = 60):
        """
        Args:
            limit: Max requests allowed in the window.
            window: Time window size in seconds.
        """
        self.limit = limit
        self.window = window

    async def __call__(self, request: Request):
        # We can bypass rate limits in testing/debug mode if needed,
        # but in production we always rate limit.
        
        # Identify requester by user ID from authenticated state (request.state.user)
        # or fall back to client IP address.
        user = getattr(request.state, "user", None)
        identifier = f"user:{user.id}" if user else f"ip:{request.client.host}"
        
        key = f"rate_limit:{request.url.path}:{identifier}"
        
        try:
            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=1.0)
            
            # Simple fixed window implementation
            current_time = int(time.time())
            window_bucket = current_time // self.window
            redis_key = f"{key}:{window_bucket}"
            
            # Increment request counter
            pipe = r.pipeline()
            pipe.incr(redis_key)
            pipe.expire(redis_key, self.window * 2)
            results = await pipe.execute()
            
            request_count = results[0]
            
            if request_count > self.limit:
                logger.warning(f"Rate limit exceeded for {identifier} on {request.url.path}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later."
                )
                
        except HTTPException:
            raise
        except Exception as e:
            # Degrade gracefully: log warning and continue
            logger.warning(f"Redis rate limiter failed, bypassing rate limit checks: {str(e)}")
            return
