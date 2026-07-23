import asyncio
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from app.services import history_cache
from app.services.cached_feedback_service import CachedFeedbackService
from app.services.history_cache import (
    HISTORY_CACHE_KEY,
    HISTORY_CACHE_TTL_SECONDS,
    ReviewHistoryCache,
)


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}
        self.last_ttl: int | None = None
        self.deleted: list[str] = []

    async def get(self, key: str) -> str | None:
        return self.values.get(key)

    async def set(self, key: str, value: str, *, ex: int) -> None:
        self.values[key] = value
        self.last_ttl = ex

    async def delete(self, key: str) -> None:
        self.values.pop(key, None)
        self.deleted.append(key)


class FakeReviewService:
    def __init__(self) -> None:
        now = datetime.now(UTC)
        self.feedback = SimpleNamespace(
            id=uuid4(),
            review="Great pizza",
            label="positive",
            score=5,
            theme="pizza",
            suggestion="Keep quality consistent.",
            confidence=0.98,
            created_at=now,
            updated_at=now,
        )
        self.history_calls = 0

    def get_history(self) -> list[SimpleNamespace]:
        self.history_calls += 1
        return [self.feedback]

    def analyze_and_save(self, _review: str) -> SimpleNamespace:
        return self.feedback

    def delete_feedback(self, _feedback_id) -> SimpleNamespace:
        return self.feedback


def install_fake_redis(fake_redis: FakeRedis, monkeypatch) -> None:
    async def get_fake_redis() -> FakeRedis:
        return fake_redis

    monkeypatch.setattr(history_cache, "get_redis", get_fake_redis)


def test_history_is_cached_for_ten_minutes(monkeypatch) -> None:
    fake_redis = FakeRedis()
    install_fake_redis(fake_redis, monkeypatch)
    review_service = FakeReviewService()
    service = CachedFeedbackService(  # type: ignore[arg-type]
        review_service,
        ReviewHistoryCache(),
    )

    first = asyncio.run(service.get_history())
    second = asyncio.run(service.get_history())

    assert first == second
    assert review_service.history_calls == 1
    assert fake_redis.last_ttl == HISTORY_CACHE_TTL_SECONDS == 600


def test_successful_save_invalidates_history_cache(monkeypatch) -> None:
    fake_redis = FakeRedis()
    fake_redis.values[HISTORY_CACHE_KEY] = "stale"
    install_fake_redis(fake_redis, monkeypatch)
    service = CachedFeedbackService(  # type: ignore[arg-type]
        FakeReviewService(),
        ReviewHistoryCache(),
    )

    asyncio.run(service.analyze_and_save("Great pizza"))

    assert HISTORY_CACHE_KEY not in fake_redis.values
    assert fake_redis.deleted == [HISTORY_CACHE_KEY]


def test_successful_delete_invalidates_history_cache(monkeypatch) -> None:
    fake_redis = FakeRedis()
    fake_redis.values[HISTORY_CACHE_KEY] = "stale"
    install_fake_redis(fake_redis, monkeypatch)
    service = CachedFeedbackService(  # type: ignore[arg-type]
        FakeReviewService(),
        ReviewHistoryCache(),
    )

    asyncio.run(service.delete_feedback(uuid4()))

    assert HISTORY_CACHE_KEY not in fake_redis.values
    assert fake_redis.deleted == [HISTORY_CACHE_KEY]
