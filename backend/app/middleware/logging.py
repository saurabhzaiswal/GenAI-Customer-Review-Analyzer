from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        print(f"{request.method} {request.url.path}")

        response = await call_next(request)

        return response