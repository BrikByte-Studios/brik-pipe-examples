"""
Basic test suite for the Python API Example.

Uses FastAPI's TestClient (based on Starlette/requests) to perform
an HTTP GET against the /health endpoint and verifies:

- HTTP 200 OK
- JSON body: {"status": "ok"}.
"""

from fastapi.testclient import TestClient

from main import app


# Initialize a test client once per module
client = TestClient(app)


def test_health_returns_ok() -> None:
    """
    /health should respond with HTTP 200 and JSON {"status": "ok"}.
    """
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok124"}
