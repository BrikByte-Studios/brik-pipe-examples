import os
import responses


def _external_base_url() -> str:
    return os.getenv("EXTERNAL_API_BASE_URL", "https://api.example.com").rstrip("/")


def mock_external_payment():
    base_url = _external_base_url()
    url = f"{base_url}/external/payment"

    responses.post(
        url,
        json={"status": "approved", "transaction_id": "mock-tx-123"},
        status=200,
    )
