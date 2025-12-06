"""
Integration tests for the Python FastAPI example service used by BrikByteOS.

These tests validate that:
  - The root endpoint (GET /) returns the expected JSON payload.
  - The health endpoint (GET /health) returns the expected JSON payload.

Notes
-----
- Tests are written as *integration* tests because they exercise the real
  FastAPI application object (`app`) just like the containers do.
- Marked with @pytest.mark.integration so they are picked up by
  `pytest -m integration` in the BrikPipe integration test runner.
"""

import pytest
from fastapi.testclient import TestClient

from main import app


# Create a reusable TestClient instance for this module.
client = TestClient(app)


@pytest.mark.integration
def test_root_endpoint_returns_expected_message() -> None:
    """
    GIVEN the FastAPI application is running
    WHEN  the caller performs GET /
    THEN  the response status is 200
          AND the JSON body matches the expected message.
    """
    response = client.get("/")

    # Basic HTTP assertion
    assert response.status_code == 200, "GET / should return HTTP 200 OK"

    # JSON payload assertion
    data = response.json()
    assert isinstance(data, dict), "Root response should be a JSON object"
    assert data.get("message") == "Python API Example — BrikByteOS pipelines OK"


@pytest.mark.integration
def test_health_endpoint_returns_status_ok() -> None:
    """
    GIVEN the FastAPI application is running
    WHEN  the caller performs GET /health
    THEN  the response status is 200
          AND the JSON body contains {"status": "ok"}.
    """
    response = client.get("/health")

    # Basic HTTP assertion
    assert response.status_code == 200, "GET /health should return HTTP 200 OK"

    # JSON payload assertion
    data = response.json()
    assert isinstance(data, dict), "Health response should be a JSON object"
    assert data.get("status") == "ok"