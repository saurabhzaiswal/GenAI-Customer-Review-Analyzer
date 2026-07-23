from hashlib import sha256

from redis.exceptions import RedisError

from app.core.config import settings
from app.core.metrics import REDIS_CACHE_OPERATIONS_TOTAL
from app.core.redis import get_redis
from app.schemas.feedback import AnalysisResponse
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text

REVIEW_CACHE_TTL_SECONDS = 24 * 60 * 60


class ReviewCache:
    """Optional Redis cache for successful, analysis-only AI responses."""

    def build_key(self, review: str) -> str:
        normalized_review = " ".join(sanitize_text(review).split())
        digest = sha256(normalized_review.encode("utf-8")).hexdigest()
        provider = settings.AI_PROVIDER.lower()
        return f"review_cache:{provider}:{settings.AI_MODEL}:{digest}"

    async def get(self, review: str) -> AnalysisResponse | None:
        redis = await get_redis()
        if redis is None:
            return None

        key = self.build_key(review)
        try:
            cached = await redis.get(key)
            if cached is None:
                REDIS_CACHE_OPERATIONS_TOTAL.labels("ai_response", "miss").inc()
                return None
            response = AnalysisResponse.model_validate_json(cached)
            REDIS_CACHE_OPERATIONS_TOTAL.labels("ai_response", "hit").inc()
            return response
        except (RedisError, OSError, TimeoutError, ValueError) as exc:
            REDIS_CACHE_OPERATIONS_TOTAL.labels("ai_response", "error").inc()
            logger.warning("Review cache read failed for %s: %s", key, exc)
            return None

    async def set(self, review: str, analysis: AnalysisResponse) -> None:
        redis = await get_redis()
        if redis is None:
            return

        key = self.build_key(review)
        try:
            await redis.set(
                key,
                analysis.model_dump_json(),
                ex=REVIEW_CACHE_TTL_SECONDS,
            )
        except (RedisError, OSError, TimeoutError) as exc:
            logger.warning("Review cache write failed for %s: %s", key, exc)
