from fastapi import APIRouter

from app.api.health_routes import router as health_router
from app.api.metrics_routes import router as metrics_router
from app.api.v1.router import router as v1_router
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(health_router)
if settings.METRICS_ENABLED:
    api_router.include_router(metrics_router)
api_router.include_router(v1_router, prefix="/api")
