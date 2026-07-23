from collections.abc import Awaitable, Callable
from time import perf_counter

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.routing import Match

from app.core.metrics import (
    HTTP_REQUEST_DURATION_SECONDS,
    HTTP_REQUESTS_IN_PROGRESS,
    HTTP_REQUESTS_TOTAL,
)

METRICS_PATH = "/metrics"


def resolve_endpoint(request: Request) -> str:
    """Return a route template instead of a high-cardinality concrete path."""
    for route in request.app.routes:
        match, _ = route.matches(request.scope)
        if match is Match.FULL:
            return getattr(route, "path", request.url.path)
    return "unmatched"


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.url.path == METRICS_PATH:
            return await call_next(request)

        method = request.method
        endpoint = resolve_endpoint(request)
        labels = HTTP_REQUESTS_IN_PROGRESS.labels(method, endpoint)
        labels.inc()
        started_at = perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            labels.dec()
            HTTP_REQUESTS_TOTAL.labels(method, endpoint, str(status_code)).inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(method, endpoint).observe(
                perf_counter() - started_at
            )
