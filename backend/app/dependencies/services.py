from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.feedback_repository import FeedbackRepository
from app.services.cached_feedback_service import CachedFeedbackService
from app.services.cached_review_service import CachedReviewService
from app.services.ai.factory import AIProviderFactory
from app.services.ai.instrumented_provider import InstrumentedAIProvider
from app.services.history_cache import ReviewHistoryCache
from app.services.review_cache import ReviewCache
from app.services.review_service import ReviewService


@lru_cache
def get_ai_provider():
    return InstrumentedAIProvider(AIProviderFactory.create())


def get_feedback_repository(db: Session = Depends(get_db)) -> FeedbackRepository:
    return FeedbackRepository(db)


@lru_cache
def get_review_service():
    """DB-free service for analysis-only requests."""
    return ReviewService(ai_provider=get_ai_provider())


@lru_cache
def get_cached_review_service() -> CachedReviewService:
    return CachedReviewService(
        review_service=get_review_service(),
        cache=ReviewCache(),
    )


def get_review_service_with_repository(
    repository: FeedbackRepository = Depends(get_feedback_repository),
) -> ReviewService:
    """Request-scoped service backed by a request-scoped SQLAlchemy session."""
    return ReviewService(ai_provider=get_ai_provider(), repository=repository)


def get_cached_feedback_service(
    review_service: ReviewService = Depends(get_review_service_with_repository),
) -> CachedFeedbackService:
    """Request-scoped persistence service with optional shared history caching."""
    return CachedFeedbackService(
        review_service=review_service,
        cache=ReviewHistoryCache(),
    )
