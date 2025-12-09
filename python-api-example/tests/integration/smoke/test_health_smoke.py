import os
import httpx
import pytest

# Optional marker so these also run in full integration suites
pytestmark = pytest.mark.integration


def get_app_base_url() -> str:
    """
    Resolve APP_BASE_URL for the running container.

    In CI:
      - APP_BASE_URL is injected by the integration-test-runner
        (e.g. http://app:8080).
    Locally (fallback):
      - Use http://localhost:8080
    """
    return os.getenv("APP_BASE_URL", "http://localhost:8080")


def test_health_endpoint_smoke():
    """
    SMOKE: /health returns 200 and JSON containing status='ok'.

    This is intentionally minimal:
      - No DB assertions.
      - No deep payload inspection.
      - Just: "service is up & reporting healthy".
    """
    base_url = get_app_base_url()
    url = f"{base_url}/health"

    response = httpx.get(url, timeout=5.0)

    assert response.status_code == 200

    # Defensive: if someone misconfigures the endpoint as plain text,
    # this will fail clearly (rather than silently passing).
    data = response.json()
    assert data.get("status") == "ok"
