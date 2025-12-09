import os
import httpx
import pytest

pytestmark = pytest.mark.integration


def get_app_base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:8080")


def test_payments_smoke():
    """
    SMOKE: POST /payments accepts a simple payload and returns
    an approved transaction.

    This intentionally mirrors the dotnet / node behaviour:
      - minimal payload
      - deterministic response
    """
    base_url = get_app_base_url()
    url = f"{base_url}/payments"

    payload = {
        "amount": 100,
        "currency": "ZAR",
    }

    response = httpx.post(url, json=payload, timeout=5.0)

    assert response.status_code == 200

    data = response.json()
    # Keep assertions minimal but meaningful
    assert data.get("status") == "approved"
    assert "transactionId" in data
    assert isinstance(data["transactionId"], str)
    assert data["transactionId"]
