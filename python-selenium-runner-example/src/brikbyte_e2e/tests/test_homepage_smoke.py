import os
import requests
import pytest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver as RemoteWebDriver
from selenium.webdriver.support import expected_conditions as EC

from brikbyte_e2e.config.env import Env
from brikbyte_e2e.util.waits import wait


def _build_options(browser: str, headless: bool):
    """
    Build browser options for RemoteWebDriver.

    NOTE: Containerized browsers often require:
    - --no-sandbox
    - --disable-dev-shm-usage
    """
    if browser == "chrome":
        from selenium.webdriver import ChromeOptions

        opts = ChromeOptions()
        if headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--window-size=1365,768")
        return opts

    if browser == "firefox":
        from selenium.webdriver import FirefoxOptions

        opts = FirefoxOptions()
        if headless:
            opts.add_argument("-headless")
        return opts

    if browser == "edge":
        from selenium.webdriver import EdgeOptions

        opts = EdgeOptions()
        if headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--window-size=1365,768")
        return opts

    raise ValueError(f"Unsupported BROWSER: {browser}. Use chrome|firefox|edge")


@pytest.fixture
def env() -> Env:
    return Env.from_env()


@pytest.fixture
def driver(env: Env) -> RemoteWebDriver:
    """
    Create RemoteWebDriver session against Selenium Grid.

    The browser session runs inside Selenium node containers,
    so env.e2e_target_url MUST be resolvable from containers.
    """
    opts = _build_options(env.browser, env.headless)

    drv = webdriver.Remote(
        command_executor=env.selenium_remote_url,
        options=opts,
    )

    # Deterministic timeouts
    drv.set_page_load_timeout(env.pageload_timeout)
    drv.implicitly_wait(env.implicit_wait)

    try:
        yield drv
    finally:
        # Always quit to release sessions
        drv.quit()


def test_homepage_smoke(env: Env, driver: RemoteWebDriver):
    """
    Smoke test:
    - app base URL responds (best-effort precheck)
    - homepage loads
    - basic DOM sanity check (title or body present)
    """
    # Best-effort HTTP precheck (runs on host runner, not inside browser container)
    # Useful for fast fail when app isn't running at all.
    try:
        r = requests.get(env.e2e_target_url, timeout=5)
        assert r.status_code < 500
    except Exception:
        # Don't fail here; the real truth is browser reachability.
        pass

    driver.get(env.e2e_target_url)

    # Minimal deterministic assertion:
    # Wait for <body> to exist.
    wait(driver, env.explicit_wait).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    assert "ERR_NAME_NOT_RESOLVED" not in (driver.title or "")
