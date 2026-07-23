from uuid import UUID

from starlette.concurrency import run_in_threadpool

from app.core.metrics import REVIEW_ANALYSES_COMPLETED_TOTAL
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackResponse
from app.services.history_cache import ReviewHistoryCache
from app.services.review_service import ReviewService


class CachedFeedbackService:
    """Persistence facade that keeps the optional history cache coherent."""

    def __init__(self, review_service: ReviewService, cache: ReviewHistoryCache):
        self.review_service = review_service
        self.cache = cache

    async def analyze_and_save(self, review: str) -> Feedback:
        feedback = await run_in_threadpool(
            self.review_service.analyze_and_save,
            review,
        )
        await self.cache.invalidate()
        REVIEW_ANALYSES_COMPLETED_TOTAL.labels("analyze_and_save", "ai").inc()
        return feedback

    async def get_history(self) -> list[FeedbackResponse]:
        cached = await self.cache.get()
        if cached is not None:
            return cached

        history = await run_in_threadpool(self.review_service.get_history)
        response = [FeedbackResponse.model_validate(item) for item in history]
        await self.cache.set(response)
        return response

    async def delete_feedback(self, feedback_id: UUID) -> Feedback | None:
        feedback = await run_in_threadpool(
            self.review_service.delete_feedback,
            feedback_id,
        )
        if feedback is not None:
            await self.cache.invalidate()
        return feedback
