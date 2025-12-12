from selenium.webdriver.support.ui import WebDriverWait


def wait(driver, seconds: int) -> WebDriverWait:
    """
    Centralized explicit wait factory.

    Keep this small and predictable: tests should use explicit waits for
    page readiness / critical element presence to reduce flakiness.
    """
    return WebDriverWait(driver, seconds)
