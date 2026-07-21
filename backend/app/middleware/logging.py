from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

from app.utils.logger import logger


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        # Use the app's logger instead of print() or logging.getLogger() to
        # (app/utils/logger.py) so log level, timestamps, and format stay
        # consistent with the rest of the app and can be redirected/filtered
        # in production.
        logger.info(f"{request.method} {request.url.path}")

        response = await call_next(request)

        request_id = getattr(request.state, "request_id", None)
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code}"
            + (f" [{request_id}]" if request_id else "")
        )

        return response
