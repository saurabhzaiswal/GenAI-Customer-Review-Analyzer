from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.api_response import ApiResponse
from app.utils.responses import success_response

router = APIRouter(tags=["Health"])

# Stored once when this module is imported
app_started_at = datetime.now(UTC)


@router.get("/", response_model=ApiResponse[dict[str, Any]])
def health_check():
    now = datetime.now(UTC)
    uptime = now - app_started_at

    payload = {
        "status": "healthy",
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "started_at": app_started_at.isoformat(),
        "uptime_seconds": int(uptime.total_seconds()),
    }

    return success_response(
        data=payload,
        message="Health check passed.",
    )


@router.get("/health", response_model=ApiResponse[dict[str, str]])
def health():
    return success_response(
        data={"status": "ok"},
        message="Health is OK.",
    )
