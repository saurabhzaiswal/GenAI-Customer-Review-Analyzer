from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from app.api.health_routes import router as health_router
from app.api.v1.review_routes import router as review_router
from app.core.config import settings

from app.core.lifespan import lifespan
from app.middleware.cors import register_cors
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.logging import LoggingMiddleware


from app.exceptions.custom_exceptions import AppException
from app.exceptions.handlers import (
    app_exception_handler,
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)


load_dotenv()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
# Middleware
register_cors(app)

# Exception Handlers

app.add_exception_handler(
    AppException,
    app_exception_handler,
)

app.add_exception_handler(
    Exception,
    global_exception_handler,
)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

# Routes
app.include_router(health_router)
app.include_router(review_router, prefix="/api/v1")
