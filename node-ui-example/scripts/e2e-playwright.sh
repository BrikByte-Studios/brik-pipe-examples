#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT}/node-ui-example"

make deps
make playwright-install

# Start app (background) + always stop it
npm start > "${ROOT}/e2e-app.log" 2>&1 &
APP_PID=$!
trap 'kill "${APP_PID}" 2>/dev/null || true' EXIT

echo "APP_PID=${APP_PID}"

# Wait for readiness (fail hard if not ready)
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
  echo "---- e2e-app.log (tail) ----"
  tail -n 200 "${ROOT}/e2e-app.log" || true
  exit 1
fi

# Run E2E (shard-aware)
make e2e-playwright E2E_TARGET_URL=http://localhost:3000
