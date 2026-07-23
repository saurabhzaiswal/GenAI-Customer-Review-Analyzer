from app.api.health_routes import health, health_check


def test_health_returns_direct_payload() -> None:
    assert health() == {"status": "ok"}


def test_root_health_has_no_success_envelope() -> None:
    response = health_check()

    assert response["status"] == "healthy"
    assert "success" not in response
    assert "data" not in response
