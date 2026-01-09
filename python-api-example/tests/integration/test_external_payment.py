import os
import re
from urllib.parse import urljoin

import pytest
import requests
import responses

from tests.integration.mocks.external_api_mocks import mock_external_payment


@pytest.mark.integration
@responses.activate
def test_integration_payment_uses_mocked_provider(app_base_url: str):
    # Ensure service under test points at the same external base we will mock.
    os.environ["EXTERNAL_API_BASE_URL"] = "https://api.example.com"

    # Allow calls to our own service to pass through unmocked
    responses.add_passthru(re.compile(rf"^{re.escape(app_base_url)}"))

    # Register mock for the external provider
    mock_external_payment()

    payments_url = urljoin(app_base_url + "/", "payments")
    resp = requests.post(
        payments_url,
        json={"amount": 100, "currency": "ZAR"},
        timeout=10,
    )

    assert resp.status_code == 200
    assert resp.json() == {
        "status": "approved",
        "transactionId": "mock-tx-123",
    }
