import os
import json
import time
from pathlib import Path

import pytest
import requests
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities


def _audit_dir() -> Path:
    # Keep audit artifacts in repo-relative python-selenium-example/.audit/
    # so the reusable workflow can upload: ${{ inputs.service_workdir }}/.audit/**
    here = Path(__file__).resolve().parent
    out = here / ".audit"
    out.mkdir(parents=True, exist_ok=True)
    return out


def _env(name: str, default: str = "") -> str:
    val = os.getenv(name, default)
    return val.strip() if isinstance(val, str) else str(val)


def _normalize_base_url(url: str) -> str:
    url = url.rstrip("/")
    return url


def _make_remote_driver(browser: str, remote_url: str):
    browser = browser.lower().strip()

    # Selenium Grid 4 prefers W3C caps via Options, but simple caps also work.
    # Use Options for stability.
    if browser == "chrome":
        options = webdriver.ChromeOptions()
        options.add_argument("--window-size=1440,900")
        # options.add_argument("--headless=new")  # Grid nodes usually run headed in containers; keep off unless needed
        return webdriver.Remote(command_executor=remote_url, options=options)

    if browser == "firefox":
        options = webdriver.FirefoxOptions()
        options.add_argument("--width=1440")
        options.add_argument("--height=900")
        return webdriver.Remote(command_executor=remote_url, options=options)

    if browser in ("edge", "microsoftedge"):
        options = webdriver.EdgeOptions()
        options.add_argument("--window-size=1440,900")
        return webdriver.Remote(command_executor=remote_url, options=options)

    raise ValueError(f"Unsupported BROWSER='{browser}'. Expected chrome|firefox|edge.")


def _wait_for_http_ok(url: str, timeout_seconds: int = 30) -> None:
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


@pytest.fixture(scope="session")
def e2e_base_url() -> str:
    """
    Base URL of app under test.
    Note: When running in Selenium container network, localhost != host.
    Caller workflow should pass something reachable from nodes:
      - http://host.docker.internal:3000 (with host-gateway mapping)
      - OR http://app:3000 if app is on same docker network as grid nodes
    """
    base = _normalize_base_url(_env("E2E_TARGET_URL"))
    if not base:
        raise RuntimeError("E2E_TARGET_URL is required")

    # Optional: sanity check from the runner (host). This doesn't guarantee the browser node can reach it,
    # but it catches obvious failures early.
    # If you don’t want this, comment it out.
    try:
        _wait_for_http_ok(base, timeout_seconds=20)
    except Exception:
        # don't fail hard here; the browser node is the real source of truth.
        pass

    return base


@pytest.fixture(scope="session")
def browser_name() -> str:
    b = _env("BROWSER", "chrome")
    return b


@pytest.fixture(scope="session")
def selenium_remote_url() -> str:
    remote = _env("SELENIUM_REMOTE_URL")
    if not remote:
        raise RuntimeError("SELENIUM_REMOTE_URL is required (e.g., http://localhost:4444/wd/hub)")
    return remote


@pytest.fixture()
def driver(request, browser_name: str, selenium_remote_url: str):
    out = _audit_dir()
    meta = {
        "browser": browser_name,
        "selenium_remote_url": selenium_remote_url,
        "test": request.node.nodeid,
    }
    (out / "run-meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    d = _make_remote_driver(browser_name, selenium_remote_url)
    d.set_page_load_timeout(60)
    yield d

    # Always attempt to write a final screenshot on teardown (best-effort)
    try:
        screenshot = out / f"teardown-{request.node.name}.png"
        d.save_screenshot(str(screenshot))
    except Exception:
        pass

    try:
        d.quit()
    except Exception:
        pass


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    # Capture screenshot + page source on failures
    outcome = yield
    rep = outcome.get_result()

    if rep.when == "call" and rep.failed:
        out = _audit_dir()
        drv = item.funcargs.get("driver", None)
        if drv:
            try:
                drv.save_screenshot(str(out / f"FAIL-{item.name}.png"))
            except Exception:
                pass
            try:
                (out / f"FAIL-{item.name}.html").write_text(drv.page_source or "", encoding="utf-8")
            except Exception:
                pass
