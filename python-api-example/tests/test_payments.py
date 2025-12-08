"""
Unit tests for the /payments endpoint of the Python API Example.

These are pure FastAPI/TestClient tests (no real network, no containers).

They verify:
- POST /payments with a valid payload returns HTTP 200
- Response body matches the expected approved structure
- Invalid payloads are rejected with HTTP 422 (FastAPI validation)
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_payments_returns_approved_response_with_valid_payload() -> None:
    """
    POST /payments with a valid JSON payload should:

    - Return HTTP 200
    - Return the fixed approved response:
      {"status": "approved", "transactionId": "mock-tx-123"}
    """
    payload = {
        "amount": 100,
        "currency": "ZAR",
    }

    resp = client.post("/payments", json=payload)

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/json")
    assert resp.json() == {
        "status": "approved",
        "transactionId": "mock-tx-123",
    }


def test_payments_rejects_missing_amount() -> None:
    """
    Missing 'amount' should trigger FastAPI/Pydantic validation
    and return HTTP 422 with a validation error structure.
    """
    payload = {
        # "amount" is missing
        "currency": "ZAR",
    }

    resp = client.post("/payments", json=payload)

    assert resp.status_code == 422
    body = resp.json()
    assert body["detail"]
    # At least one error mentions 'amount'
    assert any("amount" in err["loc"] for err in body["detail"])


def test_payments_rejects_missing_currency() -> None:
    """
    Missing 'currency' should also trigger validation and return HTTP 422.
    """
    payload = {
        "amount": 100,
        # "currency" is missing
    }

    resp = client.post("/payments", json=payload)

    assert resp.status_code == 422
    body = resp.json()
    assert body["detail"]
    assert any("currency" in err["loc"] for err in body["detail"])
