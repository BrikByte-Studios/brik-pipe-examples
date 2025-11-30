#!/usr/bin/env bash
# =============================================================================
# BrikByteOS — Benchmark Regression Issue Builder
# -----------------------------------------------------------------------------
# Generates a GitHub Issue Body file when cache performance falls below
# the required threshold.
#
# Used by: PIPE-CACHE-BENCHMARK-TEST-005
#
# Inputs (env vars expected):
#   LANGUAGE                → node | python | java | go | dotnet
#   COLD_BUILD_MS           → first-run (uncached) build duration
#   WARM_BUILD_MS           → cached build duration
#   IMPROVEMENT_PCT         → computed performance improvement %
#   MIN_IMPROVEMENT_PCT     → minimum required threshold (default 30%)
#   BENCHMARK_STATUS        → PASS | REGRESSION
#   ISSUE_BODY_FILE         → output path for generated .md body
# =============================================================================

set -euo pipefail

if [ -z "${ISSUE_BODY_FILE:-}" ]; then
  echo "❌ ERROR: ISSUE_BODY_FILE not defined"
  exit 1
fi

mkdir -p "$(dirname "$ISSUE_BODY_FILE")"

cat > "${ISSUE_BODY_FILE}" <<EOF
Cache benchmark regression detected for **${LANGUAGE}**.

**Metrics**
- Cold build:  \`${COLD_BUILD_MS} ms\`
- Warm build:  \`${WARM_BUILD_MS} ms\`
- Improvement: \`${IMPROVEMENT_PCT}%\`
- Required minimum improvement: \`${MIN_IMPROVEMENT_PCT}%\`

**Status**
- ${BENCHMARK_STATUS}

Please investigate:
- Dependency caching configuration for ${LANGUAGE}
- Recent changes to build/test pipeline
- Runner variability / flakiness

Task: PIPE-CACHE-BENCHMARK-TEST-005
EOF

echo "📄 Regression issue body generated → ${ISSUE_BODY_FILE}"
exit 0
