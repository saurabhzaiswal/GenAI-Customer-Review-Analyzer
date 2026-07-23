import pytest

from app.core import redis


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.mark.anyio
async def test_invalid_redis_url_disables_redis_without_breaking_startup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(redis.settings, "REDIS_URL", "example.upstash.io:6379")
    monkeypatch.setattr(redis, "_client", None)
    monkeypatch.setattr(redis, "_next_retry_at", 0.0)

    assert await redis.initialize_redis() is None
    assert redis._client is None


@pytest.mark.anyio
async def test_blank_redis_url_disables_redis(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(redis.settings, "REDIS_URL", "   ")
    monkeypatch.setattr(redis, "_client", None)
    monkeypatch.setattr(redis, "_next_retry_at", 0.0)

    assert await redis.initialize_redis() is None
    assert redis._client is None
