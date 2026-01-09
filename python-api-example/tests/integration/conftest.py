import os
import time
from urllib.parse import urljoin

import httpx
import pytest


def _base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:8080").rstrip("/")


@pytest.fixture(scope="session")
def app_base_url() -> str:
    return _base_url()


@pytest.fixture(scope="session", autouse=True)
def wait_for_app_ready(app_base_url: str):
    """
    Wait for the containerized API to be reachable before running integration tests.
    Avoids flaky 'connection refused' when compose says 'healthy' but the port isn't
    open to the host yet.
    """
    deadline_seconds = int(os.getenv("APP_READY_TIMEOUT_SECONDS", "30"))
    sleep_seconds = float(os.getenv("APP_READY_POLL_SECONDS", "0.5"))

    url = urljoin(app_base_url + "/", "health")

    last_err = None
    start = time.time()
    while time.time() - start < deadline_seconds:
        try:
            r = httpx.get(url, timeout=2.0)
            if r.status_code == 200:
                return
        except Exception as e:
            last_err = e
        time.sleep(sleep_seconds)

    raise RuntimeError(f"App not ready at {url} within {deadline_seconds}s. Last error: {last_err}")
