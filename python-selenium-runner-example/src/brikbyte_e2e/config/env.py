import os
from dataclasses import dataclass
from dotenv import load_dotenv

# Load .env if present (local convenience)
load_dotenv(override=False)


def _getenv(name: str, default: str | None = None) -> str:
    val = os.getenv(name, default)
    if val is None or val.strip() == "":
        raise ValueError(f"Missing required env var: {name}")
    return val.strip()


def _getbool(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "y", "on")


def _getint(name: str, default: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError as e:
        raise ValueError(f"Invalid int for env var {name}: {raw}") from e


@dataclass(frozen=True)
class Env:
    selenium_remote_url: str
    e2e_target_url: str
    browser: str
    headless: bool
    pageload_timeout: int
    implicit_wait: int
    explicit_wait: int

    @staticmethod
    def from_env() -> "Env":
        return Env(
            selenium_remote_url=_getenv("SELENIUM_REMOTE_URL"),
            e2e_target_url=_getenv("E2E_TARGET_URL"),
            browser=os.getenv("BROWSER", "chrome").strip().lower(),
            headless=_getbool("HEADLESS", "true"),
            pageload_timeout=_getint("PAGELOAD_TIMEOUT", 30),
            implicit_wait=_getint("IMPLICIT_WAIT", 0),
            explicit_wait=_getint("EXPLICIT_WAIT", 15),
        )