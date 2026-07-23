import asyncio
from time import monotonic
from urllib.parse import urlsplit

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings
from app.utils.logger import logger

REDIS_RETRY_INTERVAL_SECONDS = 30.0
SUPPORTED_REDIS_SCHEMES = frozenset({"redis", "rediss", "unix"})

_client: Redis | None = None
_initialization_lock = asyncio.Lock()
_next_retry_at = 0.0


async def initialize_redis() -> Redis | None:
    """Create and verify the shared Redis client when Redis is configured."""
    global _client, _next_retry_at

    redis_url = settings.REDIS_URL.strip() if settings.REDIS_URL else ""
    if not redis_url:
        return None
    if _client is not None:
        return _client
    if monotonic() < _next_retry_at:
        return None

    async with _initialization_lock:
        if _client is not None:
            return _client
        if monotonic() < _next_retry_at:
            return None

        scheme = urlsplit(redis_url).scheme.lower()
        if scheme not in SUPPORTED_REDIS_SCHEMES:
            _next_retry_at = monotonic() + REDIS_RETRY_INTERVAL_SECONDS
            logger.warning(
                "Invalid REDIS_URL scheme; optional Redis features disabled. "
                "Expected redis://, rediss://, or unix://"
            )
            return None

        client: Redis | None = None
        try:
            client = Redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                health_check_interval=30,
            )
            await client.ping()
        except (RedisError, OSError, TimeoutError, TypeError, ValueError) as exc:
            if client is not None:
                await client.aclose()
            _next_retry_at = monotonic() + REDIS_RETRY_INTERVAL_SECONDS
            logger.warning(
                "Redis unavailable; optional Redis features disabled: %s", exc
            )
            return None

        _client = client
        _next_retry_at = 0.0
        logger.info("Redis connection initialized")
        return _client


async def get_redis() -> Redis | None:
    """Return the shared client, lazily initializing it when necessary."""
    return _client or await initialize_redis()


async def close_redis() -> None:
    """Close the shared Redis connection pool, if one was created."""
    global _client

    if _client is None:
        return

    try:
        await _client.aclose()
    except (RedisError, OSError, TimeoutError) as exc:
        logger.warning("Redis connection close failed: %s", exc)
    finally:
        _client = None
        logger.info("Redis connection closed")
