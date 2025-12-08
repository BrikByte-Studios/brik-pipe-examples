import os
import requests
import responses

from tests.integration.mocks.external_api_mocks import mock_external_payment

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8080")


@responses.activate
def test_integration_payment_uses_mocked_provider():
    """
    Integration-style test that verifies the Python service uses
    the mocked external payment provider instead of a real API.
    """
    # Ensure service under test points at the same base URL we will mock.
    os.environ["EXTERNAL_API_BASE_URL"] = "https://api.example.com"

    # Register mock.
    mock_external_payment()

    # Call into our service under test.
    resp = requests.post(
        f"{APP_BASE_URL}/payments",
        json={"amount": 100, "currency": "ZAR"},
        timeout=5,
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["provider_status"] == "approved"
    assert body["transaction_id"] == "mock-tx-123"
