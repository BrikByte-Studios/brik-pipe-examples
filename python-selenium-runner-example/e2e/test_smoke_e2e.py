from urllib.parse import urljoin

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_smoke_login_page_loads(driver, e2e_base_url):
    # Example path – adjust to your app routes.
    url = e2e_base_url + "/login"
    driver.get(url)

    # Minimal assertion: document title exists and page is interactive.
    assert driver.title is not None

    # Example: wait for a known element (adjust selector to your UI)
    # If you don't have stable selectors yet, keep this light.
    WebDriverWait(driver, 15).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )


def test_smoke_home_or_dashboard(driver, e2e_base_url):
    url = e2e_base_url + "/"
    driver.get(url)

    WebDriverWait(driver, 15).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
    assert "http" in driver.current_url.lower()
