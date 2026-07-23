from time import perf_counter

from app.core.config import settings
from app.core.metrics import (
    AI_REQUEST_DURATION_SECONDS,
    AI_REQUEST_FAILURES_TOTAL,
    AI_REQUESTS_TOTAL,
)
from app.schemas.feedback import AnalysisResponse
from app.services.ai.provider import AIProvider


class InstrumentedAIProvider(AIProvider):
    """Metrics decorator that preserves the provider abstraction."""

    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.provider_name = settings.AI_PROVIDER.lower()
        self.model = settings.AI_MODEL

    def analyze_review(self, review: str) -> AnalysisResponse:
        labels = (self.provider_name, self.model)
        AI_REQUESTS_TOTAL.labels(*labels).inc()
        started_at = perf_counter()

        try:
            return self.provider.analyze_review(review)
        except Exception:
            AI_REQUEST_FAILURES_TOTAL.labels(*labels).inc()
            raise
        finally:
            AI_REQUEST_DURATION_SECONDS.labels(*labels).observe(
                perf_counter() - started_at
            )
