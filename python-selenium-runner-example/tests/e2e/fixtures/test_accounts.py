"""
test_accounts.py

Purpose
-------
Centralize safe test-only credentials for E2E.

Rules (Mitigation 3)
--------------------
- Use TEST-ONLY accounts only (created in seed scripts / fixtures).
- Never use real customer emails.
- Never store real passwords in repo. Use known dummy passwords for test users.
- Do NOT print secrets or credentials to logs.

How it works
------------
- Uses env vars for test users if provided by CI.
- Falls back to hard-coded safe dummy values for local runs.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class TestAccount:
    username: str
    password: str


def _env(name: str, default: str) -> str:
    val = os.getenv(name, default)
    return val.strip() if isinstance(val, str) else str(val)


def get_test_account() -> TestAccount:
    """
    Return a test-only account.

    CI can override via:
      - E2E_TEST_USERNAME
      - E2E_TEST_PASSWORD

    These MUST refer to test-only accounts, not real users.
    """
    username = _env("E2E_TEST_USERNAME", "test.user@example.test")
    password = _env("E2E_TEST_PASSWORD", "TestPassword123!")
    return TestAccount(username=username, password=password)
