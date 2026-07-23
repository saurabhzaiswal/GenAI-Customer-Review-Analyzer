from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware import rate_limit
from app.middleware.rate_limit import RateLimitMiddleware


class FakeRedis:
    def __init__(self) -> None:
        self.counts: dict[str, int] = {}

    async def eval(
        self,
        _script: str,
        _number_of_keys: int,
        key: str,
        _window_seconds: int,
    ) -> int:
        self.counts[key] = self.counts.get(key, 0) + 1
        return self.counts[key]


def create_test_client(fake_redis: FakeRedis, monkeypatch) -> TestClient:
    async def get_fake_redis() -> FakeRedis:
        return fake_redis

    monkeypatch.setattr(rate_limit, "get_redis", get_fake_redis)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        yield

    app = FastAPI(lifespan=lifespan)
    app.add_middleware(RateLimitMiddleware)

    @app.post("/api/v1/reviews/analyze")
    async def analyze() -> dict[str, bool]:
        return {"ok": True}

    @app.post("/api/v1/reviews/analyze-and-save")
    async def analyze_and_save() -> dict[str, bool]:
        return {"ok": True}

    return TestClient(app)


def test_requests_below_analyze_limit_succeed(monkeypatch) -> None:
    with create_test_client(FakeRedis(), monkeypatch) as client:
        responses = [
            client.post(
                "/api/v1/reviews/analyze",
                headers={"X-Forwarded-For": "203.0.113.10"},
            )
            for _ in range(5)
        ]

    assert all(response.status_code == 200 for response in responses)


def test_exceeding_analyze_limit_returns_429(monkeypatch) -> None:
    with create_test_client(FakeRedis(), monkeypatch) as client:
        for _ in range(5):
            client.post(
                "/api/v1/reviews/analyze",
                headers={"X-Forwarded-For": "203.0.113.11"},
            )
        response = client.post(
            "/api/v1/reviews/analyze",
            headers={"X-Forwarded-For": "203.0.113.11"},
        )

    assert response.status_code == 429
    assert response.json() == {"detail": "Too many requests. Please try again later."}


def test_different_ips_have_independent_limits(monkeypatch) -> None:
    with create_test_client(FakeRedis(), monkeypatch) as client:
        for _ in range(5):
            first_ip_response = client.post(
                "/api/v1/reviews/analyze",
                headers={"X-Forwarded-For": "203.0.113.12"},
            )
            second_ip_response = client.post(
                "/api/v1/reviews/analyze",
                headers={"X-Forwarded-For": "203.0.113.13"},
            )

        first_ip_limited = client.post(
            "/api/v1/reviews/analyze",
            headers={"X-Forwarded-For": "203.0.113.12"},
        )

    assert first_ip_response.status_code == 200
    assert second_ip_response.status_code == 200
    assert first_ip_limited.status_code == 429


def test_analyze_and_save_has_ten_request_limit(monkeypatch) -> None:
    with create_test_client(FakeRedis(), monkeypatch) as client:
        responses = [
            client.post(
                "/api/v1/reviews/analyze-and-save",
                headers={"X-Forwarded-For": "203.0.113.14"},
            )
            for _ in range(10)
        ]
        limited = client.post(
            "/api/v1/reviews/analyze-and-save",
            headers={"X-Forwarded-For": "203.0.113.14"},
        )

    assert all(response.status_code == 200 for response in responses)
    assert limited.status_code == 429
