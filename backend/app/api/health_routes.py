from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["Health"])

# Stored once when this module is imported
app_started_at = datetime.now(UTC)


@router.get("/", response_model=dict[str, Any])
def health_check() -> dict[str, Any]:
    now = datetime.now(UTC)
    uptime = now - app_started_at

    payload = {
        "status": "healthy",
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "started_at": app_started_at.isoformat(),
        "uptime_seconds": int(uptime.total_seconds()),
    }

    return payload


@router.get("/health", response_model=dict[str, str])
def health() -> dict[str, str]:
    return {"status": "ok"}
