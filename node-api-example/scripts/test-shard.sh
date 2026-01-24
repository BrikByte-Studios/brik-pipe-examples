#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# BrikByteOS Node unit shard runner (v1)
# Ensures junit.xml is always produced.
# -----------------------------------------------------------------------------

ARTIFACT_ROOT="${ARTIFACT_ROOT:-$(pwd)/test-artifacts}"
mkdir -p "${ARTIFACT_ROOT}/test-results" "${ARTIFACT_ROOT}/coverage"

# Resolve reporter path deterministically (works on GH runners)
REPORTER_PATH="$(node -p "require.resolve('node-test-junit-reporter')")"
echo "Using reporter: ${REPORTER_PATH}"

# TEST_FILES is expected to be a space-separated list of files.
# If empty, Node will discover tests by default (still OK).
NODE_OPTIONS='--experimental-vm-modules' \
npx --yes c8 \
  --reporter=json \
  --reporter=json-summary \
  --reporter=lcov \
  --reporter=cobertura \
  --report-dir="${ARTIFACT_ROOT}/coverage" \
  node --test \
    --test-reporter "${REPORTER_PATH}" \
    --test-reporter-destination "${ARTIFACT_ROOT}/test-results/junit.xml" \
    ${TEST_FILES:-}

echo "=== junit check ==="
ls -la "${ARTIFACT_ROOT}/test-results"
test -f "${ARTIFACT_ROOT}/test-results/junit.xml"
