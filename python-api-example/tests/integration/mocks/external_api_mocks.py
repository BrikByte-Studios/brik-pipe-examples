"""
Central helper for mocking external HTTP APIs in Python integration tests
using the `responses` library.

Usage (pytest):

    from .mocks.external_api_mocks import mock_external_payment

    @responses.activate
    def test_payment_flow(mock_external_payment):
        ...
"""

import os
import responses


def _external_base_url() -> str:
    """
    Returns the external API base URL used by the service.

    In CI, this might come from ENV; default is a placeholder
    that matches what the app under test uses.
    """
    return os.getenv("EXTERNAL_API_BASE_URL", "https://api.example.com")


def mock_external_payment():
    """
    Registers a mocked /external/payment endpoint on the responses
    mocker with an approved payment response.
    """
    base_url = _external_base_url()
    url = f"{base_url}/external/payment"

    responses.post(
        url,
        json={"status": "approved", "transaction_id": "mock-tx-123"},
        status=200,
    )
