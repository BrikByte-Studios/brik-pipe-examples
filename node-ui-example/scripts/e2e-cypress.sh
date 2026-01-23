#!/usr/bin/env bash
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
cd "${ROOT}/node-ui-example"

make deps

# Start app (background) + always stop it
npm start > "${ROOT}/e2e-app.log" 2>&1 &
APP_PID=$!
trap 'kill "$APP_PID" 2>/dev/null || true' EXIT

# Wait for readiness
ready=0
for i in $(seq 1 60); do
  if curl -fsS "http://localhost:3000" >/dev/null 2>&1; then
    echo "✅ app ready"
    ready=1
    break
  fi
  sleep 2
done

if [ "${ready}" -ne 1 ]; then
  echo "❌ app not ready after 120s"
  tail -n 200 "${ROOT}/e2e-app.log" || true
  exit 1
fi

# Run Cypress (uses E2E_BROWSER + shard envs set by runner)
make e2e-cypress E2E_TARGET_URL=http://localhost:3000

# Debug proof for parser
echo "=== cypress junit check ==="
ls -la test-artifacts/e2e/test-results || true
find test-artifacts/e2e/test-results -maxdepth 2 -type f -name "*.xml" -print || true
