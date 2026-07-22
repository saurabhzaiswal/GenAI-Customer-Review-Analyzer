from datetime import UTC, datetime

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["Health"])

# Stored once when this module is imported
app_started_at = datetime.now(UTC)


@router.get("/")
def health_check():
    now = datetime.now(UTC)
    uptime = now - app_started_at

    return {
        "status": "healthy",
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "started_at": app_started_at.isoformat(),
        "uptime_seconds": int(uptime.total_seconds()),
    }


@router.get("/health")
def health():
    return {
        "status": "ok",
    }
