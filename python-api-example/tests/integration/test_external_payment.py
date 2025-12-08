import os

import pytest
import requests
import responses

from tests.integration.mocks.external_api_mocks import mock_external_payment

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8080")


@pytest.mark.integration
@responses.activate
def test_integration_payment_uses_mocked_provider():
    """
    Integration-style test that verifies the Python service uses
    the mocked external payment provider instead of a real API.
    """
    # Service under test should read this env var.
    os.environ["EXTERNAL_API_BASE_URL"] = "https://api.example.com"

    # Register the external provider mock + passthrough config.
    mock_external_payment()

    # Call the service under test (this should pass through).
    resp = requests.post(
        f"{APP_BASE_URL}/payments",
        json={"amount": 100, "currency": "ZAR"},
        timeout=5,
    )

    assert resp.status_code == 200
    assert resp.json() == {
        "status": "approved",
        "transactionId": "mock-tx-123",
    }