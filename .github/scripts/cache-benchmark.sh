#!/usr/bin/env bash
# =============================================================================
# BrikByteOS — Cross-Runtime Cache Benchmark Script
# -----------------------------------------------------------------------------
# Task: PIPE-CACHE-BENCHMARK-TEST-005
#
# Repos:
#   - Implemented in: BrikByte-Studios/brik-pipe-examples
#   - Metrics may be referenced by: BrikByte-Studios/.github (docs / dashboards)
#
# Purpose:
#   Run "cold" and "warm" builds for a given runtime (Node, Python, JVM, Go,
#   .NET), measure timings, compute cache improvement %, and emit both JSON and
#   Markdown summaries for historical tracking and CI gate enforcement.
#
# Inputs (via env):
#   - LANGUAGE                : node | python | java | go | dotnet
#   - PROJECT_PATH            : path to the example project (e.g. node-api-example)
#   - MIN_IMPROVEMENT_PCT     : minimum % improvement required for PASS (default: 30)
#   - REGRESSION_TOLERANCE_PCT: future hook for tracking against previous runs.
#   - CACHE_BENCH_OUTPUT_DIR  : where JSON + env files are written (default: .audit/cache-benchmark)
#
# Outputs:
#   - JSON:
#       ${CACHE_BENCH_OUTPUT_DIR}/<timestamp>-<language>.json
#   - ENV:
#       ${CACHE_BENCH_OUTPUT_DIR}/latest-<language>.env
#   - Markdown (append-only history):
#       brik-pipe-docs/cache/cache-benchmark-history.md
#
# Important:
#   - This script DOES NOT itself fail CI. It always exits 0.
#   - CI enforcement happens in the workflow step that reads the env/JSON.
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Helper: log with consistent prefix
# -----------------------------------------------------------------------------
log() {
  # shellcheck disable=SC2145
  echo "[CACHE-BENCH] $@"
}

# -----------------------------------------------------------------------------
# Helper: current time in milliseconds
# -----------------------------------------------------------------------------
now_ms() {
  # GNU date on GitHub runners supports %3N
  date +%s%3N
}

# -----------------------------------------------------------------------------
# Default environment values
# -----------------------------------------------------------------------------
LANGUAGE="${LANGUAGE:-unknown}"
PROJECT_PATH="${PROJECT_PATH:-.}"
MIN_IMPROVEMENT_PCT="${MIN_IMPROVEMENT_PCT:-30}"
REGRESSION_TOLERANCE_PCT="${REGRESSION_TOLERANCE_PCT:-25}"
CACHE_BENCH_OUTPUT_DIR="${CACHE_BENCH_OUTPUT_DIR:-.audit/cache-benchmark}"

# Validate inputs
if [ "${LANGUAGE}" = "unknown" ]; then
  log "❌ LANGUAGE env var is required (node|python|java|go|dotnet)."
  exit 1
fi

if [ ! -d "${PROJECT_PATH}" ]; then
  log "❌ PROJECT_PATH '${PROJECT_PATH}' does not exist."
  exit 1
fi

mkdir -p "${CACHE_BENCH_OUTPUT_DIR}"

log "Language      : ${LANGUAGE}"
log "Project path  : ${PROJECT_PATH}"
log "Min improvement % : ${MIN_IMPROVEMENT_PCT}"
log "Output dir    : ${CACHE_BENCH_OUTPUT_DIR}"

# -----------------------------------------------------------------------------
# Language-specific cache cleanup helpers
#   (best-effort; this is to approximate a cold build)
# -----------------------------------------------------------------------------
clean_caches_for_language() {
  local lang="$1"

  case "${lang}" in
    node)
      log "Cleaning Node caches (~/.npm + node_modules)..."
      rm -rf "${HOME}/.npm" || true
      rm -rf "${PROJECT_PATH}/node_modules" || true
      ;;
    python)
      log "Cleaning Python caches (pip cache + .venv)..."
      rm -rf "${HOME}/.cache/pip" || true
      rm -rf "${PROJECT_PATH}/.venv" || true
      ;;
    java)
      log "Cleaning JVM caches (~/.m2/repository + ~/.gradle/caches)..."
      rm -rf "${HOME}/.m2/repository" || true
      rm -rf "${HOME}/.gradle/caches" || true
      ;;
    go)
      log "Cleaning Go caches (GOMODCACHE + GOCACHE)..."
      rm -rf "${GOMODCACHE:-$HOME/go/pkg/mod}" || true
      rm -rf "${GOCACHE:-$HOME/.cache/go-build}" || true
      ;;
    dotnet)
      log "Cleaning .NET caches (~/.nuget/packages + ~/.dotnet/tools)..."
      rm -rf "${HOME}/.nuget/packages" || true
      rm -rf "${HOME}/.dotnet/tools" || true
      ;;
    *)
      log "⚠️  No cache cleanup defined for language '${lang}'."
      ;;
  esac
}

# -----------------------------------------------------------------------------
# Language-specific build executor
#   For now we delegate to Makefile conventions:
#      make ci  → should run clean + deps + build + test.
# -----------------------------------------------------------------------------
run_build_for_language() {
  local lang="$1"
  local mode="$2" # "cold" or "warm"

  log "▶ Running ${mode} build for ${lang} in ${PROJECT_PATH} ..."

  pushd "${PROJECT_PATH}" >/dev/null

  # You can branch on ${lang} here if you ever want custom commands per runtime.
  # For now, we assume Makefile exposes a canonical `make ci`.
  make ci

  popd >/dev/null

  log "✅ ${mode} build for ${lang} completed."
}

# -----------------------------------------------------------------------------
# Measure build time (helper)
# -----------------------------------------------------------------------------
measure_build_ms() {
  local lang="$1"
  local mode="$2"

  local start end duration

  start="$(now_ms)"
  run_build_for_language "${lang}" "${mode}"
  end="$(now_ms)"

  # duration = end - start
  duration=$(( end - start ))
  echo "${duration}"
}

# -----------------------------------------------------------------------------
# 1) COLD BUILD — clear caches + run CI
# -----------------------------------------------------------------------------
log "===== COLD BUILD ====="
clean_caches_for_language "${LANGUAGE}"
COLD_BUILD_MS="$(measure_build_ms "${LANGUAGE}" "cold")"
log "Cold build duration: ${COLD_BUILD_MS} ms"

# -----------------------------------------------------------------------------
# 2) WARM BUILD — run CI again with caches primed
# -----------------------------------------------------------------------------
log "===== WARM BUILD ====="
WARM_BUILD_MS="$(measure_build_ms "${LANGUAGE}" "warm")"
log "Warm build duration: ${WARM_BUILD_MS} ms"

# -----------------------------------------------------------------------------
# 3) Compute improvement %
#     improvement_pct = (cold - warm) / cold * 100
# -----------------------------------------------------------------------------
if [ "${COLD_BUILD_MS}" -le 0 ]; then
  log "⚠️  Cold build duration is non-positive (${COLD_BUILD_MS}); forcing improvement_pct=0."
  IMPROVEMENT_PCT="0.0"
else
  IMPROVEMENT_PCT="$(
    python - <<PY
cold = float("${COLD_BUILD_MS}")
warm = float("${WARM_BUILD_MS}")
if cold <= 0:
    print("0.0")
else:
    print(round((cold - warm) / cold * 100.0, 2))
PY
  )"
fi

log "Computed improvement_pct: ${IMPROVEMENT_PCT}%"

# -----------------------------------------------------------------------------
# 4) Determine benchmark status (PASS / FAIL)
# -----------------------------------------------------------------------------
BENCHMARK_STATUS="PASS"

# Warm must be faster; if warm >= cold, treat as regression
if python - <<PY
cold = float("${COLD_BUILD_MS}")
warm = float("${WARM_BUILD_MS}")
print("REG" if warm >= cold else "OK")
PY
then :; fi

warm_vs_cold_regression="$(
python - <<PY
cold = float("${COLD_BUILD_MS}")
warm = float("${WARM_BUILD_MS}")
print("REG" if warm >= cold else "OK")
PY
)"

if [ "${warm_vs_cold_regression}" = "REG" ]; then
  log "⚠️  Warm build is not faster than cold build (possible regression)."
  BENCHMARK_STATUS="FAIL"
elif python - <<PY
imp = float("${IMPROVEMENT_PCT}")
threshold = float("${MIN_IMPROVEMENT_PCT}")
print("FAIL" if imp < threshold else "PASS")
PY
then :; fi

status_from_threshold="$(
python - <<PY
imp = float("${IMPROVEMENT_PCT}")
threshold = float("${MIN_IMPROVEMENT_PCT}")
print("FAIL" if imp < threshold else "PASS")
PY
)"

if [ "${status_from_threshold}" = "FAIL" ]; then
  BENCHMARK_STATUS="FAIL"
fi

log "Final benchmark status for ${LANGUAGE}: ${BENCHMARK_STATUS}"

# -----------------------------------------------------------------------------
# 5) Emit JSON metrics
# -----------------------------------------------------------------------------
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
JSON_PATH="${CACHE_BENCH_OUTPUT_DIR}/${TIMESTAMP}-${LANGUAGE}.json"

cat > "${JSON_PATH}" <<EOF
{
  "language": "${LANGUAGE}",
  "project_path": "${PROJECT_PATH}",
  "cold_build_ms": ${COLD_BUILD_MS},
  "warm_build_ms": ${WARM_BUILD_MS},
  "improvement_pct": ${IMPROVEMENT_PCT},
  "min_improvement_pct_required": ${MIN_IMPROVEMENT_PCT},
  "status": "${BENCHMARK_STATUS}",
  "timestamp": "${TIMESTAMP}"
}
EOF

log "🔖 Wrote JSON metrics to ${JSON_PATH}"

# -----------------------------------------------------------------------------
# 6) Emit env file for workflow consumption
# -----------------------------------------------------------------------------
LATEST_ENV="${CACHE_BENCH_OUTPUT_DIR}/latest-${LANGUAGE}.env"

cat > "${LATEST_ENV}" <<EOF
LANGUAGE=${LANGUAGE}
PROJECT_PATH=${PROJECT_PATH}
COLD_BUILD_MS=${COLD_BUILD_MS}
WARM_BUILD_MS=${WARM_BUILD_MS}
IMPROVEMENT_PCT=${IMPROVEMENT_PCT}
MIN_IMPROVEMENT_PCT=${MIN_IMPROVEMENT_PCT}
BENCHMARK_STATUS=${BENCHMARK_STATUS}
TIMESTAMP=${TIMESTAMP}
EOF

log "🔖 Wrote env metrics to ${LATEST_ENV}"

# -----------------------------------------------------------------------------
# 7) Append Markdown summary line
#     File: brik-pipe-docs/cache/cache-benchmark-history.md
# -----------------------------------------------------------------------------
MD_PATH="brik-pipe-docs/cache/cache-benchmark-history.md"
MD_DIR="$(dirname "${MD_PATH}")"
mkdir -p "${MD_DIR}"

if [ ! -f "${MD_PATH}" ]; then
  cat > "${MD_PATH}" <<EOF
# Cache Benchmark History

> Auto-generated by PIPE-CACHE-BENCHMARK-TEST-005  
> Do not edit rows manually; they are append-only from CI.

| Timestamp        | Language | Project Path         | Cold (ms) | Warm (ms) | Improvement % | Min Required % | Status |
|------------------|----------|----------------------|-----------|-----------|---------------|----------------|--------|
EOF
fi

echo "| ${TIMESTAMP} | ${LANGUAGE} | ${PROJECT_PATH} | ${COLD_BUILD_MS} | ${WARM_BUILD_MS} | ${IMPROVEMENT_PCT} | ${MIN_IMPROVEMENT_PCT} | ${BENCHMARK_STATUS} |" >> "${MD_PATH}"

log "📘 Appended Markdown summary to ${MD_PATH}"

# -----------------------------------------------------------------------------
# 8) Script exit
#     - Always exit 0; CI enforcement is done in workflow layer.
# -----------------------------------------------------------------------------
log "✅ cache-benchmark.sh completed successfully for ${LANGUAGE}."
exit 0
