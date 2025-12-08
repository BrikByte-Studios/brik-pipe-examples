"""
Central helper for mocking external HTTP APIs in Python integration tests
using the `responses` library.

Usage (pytest):

    from .mocks.external_api_mocks import mock_external_payment

    @responses.activate
    def test_payment_flow(mock_external_payment):
        ...
"""

import re

import responses

EXTERNAL_API_BASE_URL = "https://api.example.com"


def configure_passthrough_for_app():
    """
    Allow real HTTP calls to the app under test (localhost:8080)
    to bypass 'responses' mocking.
    """
    # Any request starting with http://localhost:8080 should NOT be mocked.
    responses.add_passthru(re.compile(r"^http://localhost:8080/"))


def mock_external_payment():
    """
    Register a mock for the external payment provider endpoint.

    The application under test should call:
      POST {EXTERNAL_API_BASE_URL}/external/payment
    using the EXTERNAL_API_BASE_URL env var.
    """
    configure_passthrough_for_app()

    responses.add(
        method=responses.POST,
        url=f"{EXTERNAL_API_BASE_URL}/external/payment",
        json={"status": "approved", "transactionId": "mock-tx-123"},
        status=200,
        content_type="application/json",
    )
