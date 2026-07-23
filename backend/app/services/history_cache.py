from pydantic import TypeAdapter
from redis.exceptions import RedisError

from app.core.redis import get_redis
from app.core.metrics import REDIS_CACHE_OPERATIONS_TOTAL
from app.schemas.feedback import FeedbackResponse
from app.utils.logger import logger

HISTORY_CACHE_KEY = "review_history:all"
HISTORY_CACHE_TTL_SECONDS = 10 * 60
_history_adapter = TypeAdapter(list[FeedbackResponse])


class ReviewHistoryCache:
    """Optional cache-aside storage for the complete review history."""

    async def get(self) -> list[FeedbackResponse] | None:
        redis = await get_redis()
        if redis is None:
            return None

        try:
            cached = await redis.get(HISTORY_CACHE_KEY)
            if cached is None:
                REDIS_CACHE_OPERATIONS_TOTAL.labels("history", "miss").inc()
                return None
            response = _history_adapter.validate_json(cached)
            REDIS_CACHE_OPERATIONS_TOTAL.labels("history", "hit").inc()
            return response
        except (RedisError, OSError, TimeoutError, ValueError) as exc:
            REDIS_CACHE_OPERATIONS_TOTAL.labels("history", "error").inc()
            logger.warning("Review history cache read failed: %s", exc)
            return None

    async def set(self, history: list[FeedbackResponse]) -> None:
        redis = await get_redis()
        if redis is None:
            return

        try:
            payload = _history_adapter.dump_json(history).decode("utf-8")
            await redis.set(
                HISTORY_CACHE_KEY,
                payload,
                ex=HISTORY_CACHE_TTL_SECONDS,
            )
        except (RedisError, OSError, TimeoutError) as exc:
            logger.warning("Review history cache write failed: %s", exc)

    async def invalidate(self) -> None:
        redis = await get_redis()
        if redis is None:
            return

        try:
            await redis.delete(HISTORY_CACHE_KEY)
        except (RedisError, OSError, TimeoutError) as exc:
            logger.warning("Review history cache invalidation failed: %s", exc)
