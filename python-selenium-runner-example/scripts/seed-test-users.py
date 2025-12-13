"""
Purpose
-------
Create test-only accounts for E2E in local/dev environments.

Safety (Mitigation 3)
---------------------
- Uses reserved domain: example.test (non-routable, safe for test data)
- No production or real customer data is touched
- This script should never run against prod endpoints

Usage
-----
Local:
  python scripts/seed-test-users.py --base-url http://localhost:3000

CI:
  python scripts/seed-test-users.py --base-url http://app:3000
"""

import argparse
import requests


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    args = parser.parse_args()

    base = args.base_url.rstrip("/")
    url = f"{base}/api/test/seed-users"

    payload = {
        "users": [
            {
                "email": "test.user@example.test",
                "password": "TestPassword123!",
                "role": "tester",
            }
        ]
    }

    # Important: do not print payload (it includes password).
    r = requests.post(url, json=payload, timeout=10)
    r.raise_for_status()


if __name__ == "__main__":
    main()
