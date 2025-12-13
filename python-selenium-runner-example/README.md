# python-selenium-runner-example

Pytest + Selenium RemoteWebDriver example that runs against Selenium Grid.

## Env contract (provided by reusable workflow)

- SELENIUM_REMOTE_URL: http://localhost:4444/wd/hub
- E2E_TARGET_URL:      http://host.docker.internal:3000
- BROWSER:             chrome | firefox | edge

## Run locally (optional)

```bash
cd python-selenium-example
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export SELENIUM_REMOTE_URL="http://localhost:4444/wd/hub"
export E2E_TARGET_URL="http://localhost:3000"
export BROWSER="chrome"

pytest
```

Artifacts (screenshots/html) are written to `python-selenium-example/.audit/`.


---

## How to call it from your `e2e-ui-python.yml`

Your caller should run something like:

```yml
test_command: |
  cd python-selenium-example
  pip install -r requirements.txt
  pytest
```

And you already have the env contract in the reusable workflow.

---

## Important networking note (your root failure cause)

Your earlier error (`net::ERR_CONNECTION_REFUSED` to `http://localhost:3000/login`) happens because:
- The **browser runs inside a container** (node-chrome/node-firefox),
- so `localhost:3000` refers **to that container**, not the GitHub runner host.

So the test must use either:

1. **`E2E_TARGET_URL=http://host.docker.internal:3000` with host-gateway mapping**, or
2. `E2E_TARGET_URL=http://app:3000` if the app is on the same Docker network as the grid nodes.