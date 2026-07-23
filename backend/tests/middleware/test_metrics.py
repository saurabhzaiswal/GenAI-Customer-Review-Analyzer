from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.metrics_routes import router as metrics_router
from app.middleware.metrics import MetricsMiddleware


def create_metrics_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(MetricsMiddleware)
    app.include_router(metrics_router)

    @app.get("/work/{item_id}")
    async def work(item_id: str) -> dict[str, str]:
        return {"item_id": item_id}

    return app


def test_metrics_endpoint_exposes_http_metrics() -> None:
    with TestClient(create_metrics_app()) as client:
        response = client.get("/work/123")
        metrics = client.get("/metrics")

    assert response.status_code == 200
    assert metrics.status_code == 200
    assert "text/plain" in metrics.headers["content-type"]
    assert "http_requests_total" in metrics.text
    assert 'endpoint="/work/{item_id}"' in metrics.text
    assert 'status_code="200"' in metrics.text
    assert "http_request_duration_seconds_bucket" in metrics.text
    assert "http_requests_in_progress" in metrics.text


def test_metrics_scrape_does_not_instrument_itself() -> None:
    with TestClient(create_metrics_app()) as client:
        metrics = client.get("/metrics")

    assert 'endpoint="/metrics"' not in metrics.text
