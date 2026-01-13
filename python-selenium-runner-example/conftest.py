"""
conftest.py

Purpose
-------
Pytest fixtures + hooks for Selenium E2E with audit-friendly artifacts.

Key behaviors
-------------
- Creates a predictable local artifact folder for screenshots:
    e2e-artifacts/screenshots/
- On test failure:
    - Captures a screenshot as:
        <browser>_<test-name>_<timestamp>.png
- Does NOT print secret env values.

Env contract (used, not printed)
--------------------------------
- E2E_TARGET_URL        Base URL of the app under test (required)
- SELENIUM_REMOTE_URL   Remote WebDriver URL (required)
- BROWSER               chrome|firefox|edge (optional; default: chrome)
"""

import os
import time
import re
from pathlib import Path

import pytest
import requests
from selenium import webdriver


# -----------------------------------------------------------------------------
# Artifact directories (deterministic)
# -----------------------------------------------------------------------------
def _repo_root() -> Path:
    """
    Resolve the folder that contains this conftest.py.

    We keep artifacts relative to this directory so the workflow can upload
    `${{ inputs.service_workdir }}/e2e-artifacts/**` reliably.
    """
    return Path(__file__).resolve().parent


def _artifacts_root() -> Path:
    """
    Deterministic artifact root for Selenium E2E.

    Output:
      <service_workdir>/e2e-artifacts/
    """
    root = _repo_root() / "e2e-artifacts"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _screenshots_dir() -> Path:
    """
    Deterministic screenshot output directory.

    Output:
      <service_workdir>/e2e-artifacts/screenshots/
    """
    p = _artifacts_root() / "screenshots"
    p.mkdir(parents=True, exist_ok=True)
    return p


# -----------------------------------------------------------------------------
# Helpers (safe, non-logging)
# -----------------------------------------------------------------------------
def _env(name: str, default: str = "") -> str:
    """
    Read environment variables without printing values (avoid secrets leakage).
    """
    val = os.getenv(name, default)
    return val.strip() if isinstance(val, str) else str(val)


def _safe_name(value: str) -> str:
    """
    Convert an arbitrary string into a filesystem-friendly name.

    - Replaces whitespace with underscores.
    - Replaces non [A-Za-z0-9._-] characters with underscores.
    - Truncates length to prevent overly long filenames.
    """
    v = value.strip()
    v = re.sub(r"\s+", "_", v)
    v = re.sub(r"[^A-Za-z0-9._-]+", "_", v)
    return v[:180]


def _timestamp() -> str:
    """
    Timestamp used in artifact naming (CI friendly and sortable).
    Format: YYYYMMDD-HHMMSS
    """
    return time.strftime("%Y%m%d-%H%M%S")


def _normalize_base_url(url: str) -> str:
    return url.rstrip("/")


def _wait_for_http_ok(url: str, timeout_seconds: int = 30) -> None:
    """
    Best-effort readiness check from the test runner host.

    Note:
      In Docker/Grid scenarios, this doesn't guarantee the browser node can
      reach the URL, but it catches obvious failures early.
    """
    deadline = time.time() + timeout_seconds
    last_err = None
    while time.time() < deadline:
        try:
            r = requests.get(url, timeout=3)
            if r.status_code < 500:
                return
        except Exception as e:
            last_err = e
        time.sleep(1)
    raise RuntimeError(f"App not reachable: {url}. Last error: {last_err}")


def _make_remote_driver(browser: str, remote_url: str) -> webdriver.Remote:
    """
    Create a RemoteWebDriver using Selenium Grid 4-compatible options.
    """
    b = browser.lower().strip()

    if b == "chrome":
        options = webdriver.ChromeOptions()
        options.add_argument("--window-size=1440,900")
        return webdriver.Remote(command_executor=remote_url, options=options)

    if b == "firefox":
        options = webdriver.FirefoxOptions()
        options.add_argument("--width=1440")
        options.add_argument("--height=900")
        return webdriver.Remote(command_executor=remote_url, options=options)

    if b in ("edge", "microsoftedge"):
        options = webdriver.EdgeOptions()
        options.add_argument("--window-size=1440,900")
        return webdriver.Remote(command_executor=remote_url, options=options)

    raise ValueError(f"Unsupported BROWSER='{b}'. Expected chrome|firefox|edge.")


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------
@pytest.fixture(scope="session")
def e2e_base_url() -> str:
    """
    Base URL of the app under test.

    Standard BrikByteOS contract (preferred):
      BASE_URL or APP_BASE_URL

    Back-compat (legacy):
      E2E_TARGET_URL
    """
    base = (
        _env("BASE_URL")
        or _env("APP_BASE_URL")
        or _env("E2E_TARGET_URL")
    )
    if not base:
        raise RuntimeError("BASE_URL (preferred) or APP_BASE_URL or E2E_TARGET_URL is required")
    return _normalize_base_url(base)


@pytest.fixture(scope="session")
def browser_name() -> str:
    """
    Browser name for Selenium Grid nodes.
    """
    return _env("BROWSER", "chrome")


@pytest.fixture(scope="session")
def selenium_remote_url() -> str:
    """
    Selenium Remote WebDriver URL.

    Required:
      SELENIUM_REMOTE_URL
    """
    remote = _env("SELENIUM_REMOTE_URL")
    if not remote:
        raise RuntimeError("SELENIUM_REMOTE_URL is required (e.g., http://localhost:4444/wd/hub)")
    return remote


@pytest.fixture()
def driver(browser_name: str, selenium_remote_url: str):
    """
    Provide a Selenium RemoteWebDriver for each test.

    Note:
      We intentionally do not auto-screenshot on teardown here because your
      stated contract is "on failure" only.
    """
    d = _make_remote_driver(browser_name, selenium_remote_url)
    d.set_page_load_timeout(60)
    yield d

    try:
        d.quit()
    except Exception:
        pass


# -----------------------------------------------------------------------------
# Hooks
# -----------------------------------------------------------------------------
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    On test failure, capture a screenshot into:

      e2e-artifacts/screenshots/<browser>_<test-name>_<timestamp>.png
    """
    outcome = yield
    rep = outcome.get_result()

    if rep.when != "call" or not rep.failed:
        return

    drv = item.funcargs.get("driver")
    if not drv:
        return

    browser = _safe_name(_env("BROWSER", "unknown"))
    test_name = _safe_name(item.name)
    ts = _timestamp()

    # Best-effort screenshot capture; never raise and mask the real test failure.
    try:
        path = _screenshots_dir() / f"{browser}_{test_name}_{ts}.png"
        drv.save_screenshot(str(path))
    except Exception:
        pass
