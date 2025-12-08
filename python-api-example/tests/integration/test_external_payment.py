import os
import re

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

    Flow:
      - Test calls our API at APP_BASE_URL /payments
      - Service reads EXTERNAL_API_BASE_URL and calls external provider
      - responses mocks the external provider, not our app
    """

    # Ensure service under test points at the same base URL we will mock.
    os.environ["EXTERNAL_API_BASE_URL"] = "https://api.example.com"

    # Allow calls to our own service to pass through unmocked
    responses.add_passthru(re.compile(rf"^{re.escape(APP_BASE_URL)}"))

    # Register mock for the external provider
    mock_external_payment()

    # Call into our service under test.
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
