from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.feedback_repository import FeedbackRepository
from app.services.ai.factory import AIProviderFactory
from app.services.review_service import ReviewService


@lru_cache
def get_ai_provider():
    return AIProviderFactory.create()


def get_feedback_repository(db: Session = Depends(get_db)) -> FeedbackRepository:
    return FeedbackRepository(db)


@lru_cache
def get_review_service():
    """DB-free service for analysis-only requests."""
    return ReviewService(ai_provider=get_ai_provider())


def get_review_service_with_repository(
    repository: FeedbackRepository = Depends(get_feedback_repository),
) -> ReviewService:
    """Request-scoped service backed by a request-scoped SQLAlchemy session."""
    return ReviewService(ai_provider=get_ai_provider(), repository=repository)
