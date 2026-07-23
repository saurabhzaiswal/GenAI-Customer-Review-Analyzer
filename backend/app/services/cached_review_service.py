from starlette.concurrency import run_in_threadpool

from app.core.metrics import REVIEW_ANALYSES_COMPLETED_TOTAL
from app.schemas.feedback import AnalysisResponse
from app.services.review_cache import ReviewCache
from app.services.review_service import ReviewService


class CachedReviewService:
    """Async analysis facade that adds optional caching to ReviewService."""

    def __init__(self, review_service: ReviewService, cache: ReviewCache):
        self.review_service = review_service
        self.cache = cache

    async def analyze_review(self, review: str) -> AnalysisResponse:
        cached = await self.cache.get(review)
        if cached is not None:
            REVIEW_ANALYSES_COMPLETED_TOTAL.labels("analyze", "cache").inc()
            return cached

        analysis = await run_in_threadpool(self.review_service.analyze_review, review)
        await self.cache.set(review, analysis)
        REVIEW_ANALYSES_COMPLETED_TOTAL.labels("analyze", "ai").inc()
        return analysis
