from collections.abc import Awaitable, Callable

from fastapi import Request
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.redis import get_redis
from app.core.metrics import RATE_LIMITED_REQUESTS_TOTAL
from app.utils.logger import logger

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMITS: dict[tuple[str, str], int] = {
    ("POST", "/api/v1/reviews/analyze"): 5,
    ("POST", "/api/v1/reviews/analyze-and-save"): 10,
}
RATE_LIMIT_MESSAGE = "Too many requests. Please try again later."

_INCREMENT_WITH_EXPIRY = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
"""


def get_client_ip(request: Request) -> str:
    """Resolve the original client IP when running behind Render's proxy."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", maxsplit=1)[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        limit = RATE_LIMITS.get((request.method, request.url.path))
        if limit is None:
            return await call_next(request)

        redis = await get_redis()
        if redis is None:
            return await call_next(request)

        client_ip = get_client_ip(request)
        key = f"rate_limit:{client_ip}:{request.url.path}"

        try:
            count = int(
                await redis.eval(
                    _INCREMENT_WITH_EXPIRY,
                    1,
                    key,
                    RATE_LIMIT_WINDOW_SECONDS,
                )
            )
        except (RedisError, OSError, TimeoutError) as exc:
            logger.warning("Rate limiter failed open for %s: %s", key, exc)
            return await call_next(request)

        if count > limit:
            RATE_LIMITED_REQUESTS_TOTAL.labels(
                request.method,
                request.url.path,
            ).inc()
            return JSONResponse(
                status_code=429,
                content={"detail": RATE_LIMIT_MESSAGE},
            )

        return await call_next(request)
