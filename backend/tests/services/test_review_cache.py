import asyncio

import pytest

from app.schemas.feedback import AnalysisResponse
from app.services import review_cache
from app.services.cached_review_service import CachedReviewService
from app.services.review_cache import REVIEW_CACHE_TTL_SECONDS, ReviewCache


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}
        self.set_calls = 0
        self.last_ttl: int | None = None

    async def get(self, key: str) -> str | None:
        return self.values.get(key)

    async def set(self, key: str, value: str, *, ex: int) -> None:
        self.values[key] = value
        self.set_calls += 1
        self.last_ttl = ex


class FakeReviewService:
    def __init__(self, result: AnalysisResponse | Exception) -> None:
        self.result = result
        self.calls = 0

    def analyze_review(self, _review: str) -> AnalysisResponse:
        self.calls += 1
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


def install_fake_redis(fake_redis: FakeRedis, monkeypatch) -> None:
    async def get_fake_redis() -> FakeRedis:
        return fake_redis

    monkeypatch.setattr(review_cache, "get_redis", get_fake_redis)


def test_successful_analysis_is_cached_for_24_hours(monkeypatch) -> None:
    fake_redis = FakeRedis()
    install_fake_redis(fake_redis, monkeypatch)
    analysis = AnalysisResponse(
        label="positive",
        score=5,
        theme="service",
        suggestion="Keep it up.",
        confidence=0.95,
    )
    review_service = FakeReviewService(analysis)
    service = CachedReviewService(review_service, ReviewCache())  # type: ignore[arg-type]

    first = asyncio.run(service.analyze_review("  Great   service  "))
    second = asyncio.run(service.analyze_review("Great service"))

    assert first == analysis
    assert second == analysis
    assert review_service.calls == 1
    assert fake_redis.set_calls == 1
    assert fake_redis.last_ttl == REVIEW_CACHE_TTL_SECONDS


def test_provider_errors_are_not_cached(monkeypatch) -> None:
    fake_redis = FakeRedis()
    install_fake_redis(fake_redis, monkeypatch)
    review_service = FakeReviewService(RuntimeError("provider unavailable"))
    service = CachedReviewService(review_service, ReviewCache())  # type: ignore[arg-type]

    with pytest.raises(RuntimeError, match="provider unavailable"):
        asyncio.run(service.analyze_review("A valid review"))

    assert fake_redis.set_calls == 0
