from functools import lru_cache

from app.repositories.feedback_repository import FeedbackRepository
from app.services.ai.factory import AIProviderFactory
from app.services.review_service import ReviewService


@lru_cache
def get_ai_provider():
    return AIProviderFactory.create()


@lru_cache
def get_feedback_repository():
    return FeedbackRepository()


@lru_cache
def get_review_service():

    return ReviewService(
        ai_provider=get_ai_provider(),
        repository=get_feedback_repository(),
    )