"""
Purpose
-------
Minimal, audit-friendly Selenium smoke tests for Selenium Grid runs.

Assumptions / Env contract
--------------------------
- E2E_TARGET_URL        Base URL of app under test (required)
- BROWSER               chrome|firefox|edge (optional; set by workflow matrix)
- SELENIUM_REMOTE_URL   Remote WebDriver URL (required; set by workflow)

Artifacts
---------
- Screenshots on failure are handled by conftest.py and saved to:
    e2e-artifacts/screenshots/<browser>_<test-name>_<timestamp>.png
"""

from urllib.parse import urljoin

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def _url(base: str, path: str) -> str:
    """
    Join base + path safely.
    """
    base = base.rstrip("/") + "/"
    path = path.lstrip("/")
    return urljoin(base, path)


def _wait_visible(driver, css: str, timeout: int = 20):
    """
    Wait until an element matching CSS selector is visible.
    """
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, css))
    )


def _wait_any_title(driver, timeout: int = 20):
    """
    Wait until the document title is non-empty.
    """
    WebDriverWait(driver, timeout).until(lambda d: (d.title or "").strip() != "")
    return (driver.title or "").strip()


@pytest.mark.e2e
def test_homepage_loads(driver, e2e_base_url: str):
    """
    Smoke: the base page loads and has a non-empty title.

    This is intentionally generic across repos.
    If your app doesn't set a title, replace this assertion with a stable selector.
    """
    driver.get(e2e_base_url)
    title = _wait_any_title(driver, timeout=25)
    assert title, "Expected a non-empty document title."


@pytest.mark.e2e
def test_health_endpoint_responds(driver, e2e_base_url: str):
    """
    Smoke: health endpoint returns an HTTP 200-ish page in the browser.

    Note:
      This uses the browser (Grid node) path, not the host runner.
      If your app doesn't expose /health publicly, change `health_path`.
    """
    health_path = "/health"
    url = _url(e2e_base_url, health_path)

    driver.get(url)

    # We can't read HTTP status directly from Selenium, so we use a lightweight heuristic:
    # - page source contains something, and
    # - the browser didn't land on an obvious "error" page title.
    src = (driver.page_source or "").strip()
    assert len(src) > 0, "Expected /health to return some content."

    # Optional soft check: avoid brittle assertions.
    title = (driver.title or "").lower()
    assert "error" not in title, "Health page appears to be an error page."


@pytest.mark.e2e
def test_login_page_has_form_like_element(driver, e2e_base_url: str):
    """
    Smoke: a login page (if it exists) renders a form-like UI element.

    This is a *best-practice* smoke test for typical web apps.
    If your app doesn't have /login, update `login_path` or remove this test.

    Selector strategy:
      - prefer stable data-testid attributes in real apps
      - fall back to a generic 'form' presence
    """
    login_path = "/login"
    driver.get(_url(e2e_base_url, login_path))

    # Prefer test ids if your UI has them:
    # e.g. [data-testid="login-form"]
    candidates = [
        '[data-testid="login-form"]',
        "form",
        'input[type="email"]',
        'input[name="email"]',
        'input[type="password"]',
        'input[name="password"]',
    ]

    found = None
    for css in candidates:
        try:
            found = _wait_visible(driver, css, timeout=8)
            break
        except Exception:
            continue

    assert found is not None, (
        "Expected a login form-like element. "
        "Add stable selectors (data-testid) or update this test for your app."
    )
