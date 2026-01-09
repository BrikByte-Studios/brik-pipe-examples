from urllib.parse import urljoin

import httpx
import pytest


@pytest.mark.integration
def test_root_endpoint_returns_expected_message(app_base_url: str) -> None:
    url = urljoin(app_base_url + "/", "")
    resp = httpx.get(url, timeout=5.0)

    assert resp.status_code == 200
    data = resp.json()
    assert data.get("message") == "Python API Example — BrikByteOS pipelines OK"


@pytest.mark.integration
def test_health_endpoint_returns_status_ok(app_base_url: str) -> None:
    url = urljoin(app_base_url + "/", "health")
    resp = httpx.get(url, timeout=5.0)

    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"
