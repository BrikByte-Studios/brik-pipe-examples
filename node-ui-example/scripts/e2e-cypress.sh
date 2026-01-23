#!/usr/bin/env bash
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
cd "${ROOT}/node-ui-example"

make deps

npm start > "${ROOT}/e2e-app.log" 2>&1 &
APP_PID=$!
trap 'kill "$APP_PID" 2>/dev/null || true' EXIT

# Wait for readiness
for i in $(seq 1 60); do
  if curl -fsS "http://localhost:3000" >/dev/null 2>&1; then
    echo "✅ app ready"
    break
  fi
  sleep 2
done

# IMPORTANT: write artifacts to workspace root, not inside node-ui-example
make e2e-cypress \
  E2E_TARGET_URL=http://localhost:3000 \
  ARTIFACT_ROOT="${ROOT}/test-artifacts"

echo "=== cypress junit check ==="
ls -la "${ROOT}/test-artifacts/e2e/test-results" || true
find "${ROOT}/test-artifacts/e2e/test-results" -maxdepth 2 -type f -name "*.xml" -print || true
