#!/usr/bin/env bash
# =============================================================================
# BrikByteOS — Cross-Runtime Cache Benchmark Script
# -----------------------------------------------------------------------------
# Task: PIPE-CACHE-BENCHMARK-TEST-005
#
# Repos:
#   - Implemented in:
#       • BrikByte-Studios/brik-pipe-examples
#   - Referenced by workflow:
#       • .github/workflows/ci-cache-benchmark.yml
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------#
# Helpers
# -----------------------------------------------------------------------------#

log() {
  # shellcheck disable=SC2145
  echo "[CACHE-BENCH] $@"
}

die() {
  log "❌ $*"
  exit 1
}

# -----------------------------------------------------------------------------#
# 1) Load inputs and defaults
# -----------------------------------------------------------------------------#

LANGUAGE="${LANGUAGE:-}"
PROJECT_PATH="${PROJECT_PATH:-}"
MIN_IMPROVEMENT_PCT="${MIN_IMPROVEMENT_PCT:-30}"
CACHE_BENCH_OUTPUT_DIR="${CACHE_BENCH_OUTPUT_DIR:-.audit/cache-benchmark}"

if [[ -z "${LANGUAGE}" ]]; then
  die "LANGUAGE env var is required (node|python|java|go|dotnet)."
fi

if [[ -z "${PROJECT_PATH}" ]]; then
  die "PROJECT_PATH env var is required (e.g. node-api-example)."
fi

log "Language      : ${LANGUAGE}"
log "Project path  : ${PROJECT_PATH}"
log "Min improv %  : ${MIN_IMPROVEMENT_PCT}"
log "Output dir    : ${CACHE_BENCH_OUTPUT_DIR}"

mkdir -p "${CACHE_BENCH_OUTPUT_DIR}"

TIMESTAMP="$(date -u '+%Y%m%dT%H%M%SZ')"
HISTORY_MD="brik-pipe-docs/cache/cache-benchmark-history.md"
mkdir -p "$(dirname "${HISTORY_MD}")"

# -----------------------------------------------------------------------------#
# 2) Optional: use central cache-clean script if present
# -----------------------------------------------------------------------------#

CACHE_CLEAN_SCRIPT=".github/scripts/cache-clean.sh"

run_cache_clean() {
  if [[ ! -f "${CACHE_CLEAN_SCRIPT}" ]]; then
    log "cache-clean.sh not found at ${CACHE_CLEAN_SCRIPT} — skipping cache directory cleanup."
    return 0
  fi

  chmod +x "${CACHE_CLEAN_SCRIPT}"

  local paths=("$@")
  if [[ "${#paths[@]}" -eq 0 ]]; then
    log "No cache paths passed to run_cache_clean; nothing to clean."
    return 0
  fi

  log "Invoking cache-clean.sh for ${#paths[@]} path(s)..."
  bash "${CACHE_CLEAN_SCRIPT}" "${paths[@]}"
  log "cache-clean.sh completed."
}

# -----------------------------------------------------------------------------#
# 3) Language-specific: cache paths + build runner
# -----------------------------------------------------------------------------#

get_cold_cache_paths_for_language() {
  case "${LANGUAGE}" in
    node)
      echo "${HOME}/.npm"
      echo "${PROJECT_PATH}/node_modules"
      ;;
    python)
      echo "${HOME}/.cache/pip"
      echo "${PROJECT_PATH}/.venv"
      echo "${PROJECT_PATH}/.pytest_cache"
      ;;
    java)
      echo "${HOME}/.m2/repository"
      echo "${HOME}/.gradle/caches"
      echo "${PROJECT_PATH}/target"
      echo "${PROJECT_PATH}/build"
      ;;
    go)
      if command -v go >/dev/null 2>&1; then
        go env GOMODCACHE || true
        go env GOCACHE || true
      fi
      echo "${PROJECT_PATH}/bin"
      echo "${PROJECT_PATH}/build"
      ;;
    dotnet)
      echo "${HOME}/.nuget/packages"
      echo "${HOME}/.dotnet/tools"
      echo "${PROJECT_PATH}/bin"
      echo "${PROJECT_PATH}/obj"
      ;;
    *)
      die "Unsupported LANGUAGE '${LANGUAGE}' for cache paths."
      ;;
  esac
}

run_ci_build_for_language() {
  log "▶ Running ${LANGUAGE} CI build in ${PROJECT_PATH} ..."
  if [[ ! -d "${PROJECT_PATH}" ]]; then
    die "PROJECT_PATH '${PROJECT_PATH}' does not exist."
  fi
  if [[ ! -f "${PROJECT_PATH}/Makefile" ]]; then
    die "Makefile not found under '${PROJECT_PATH}'."
  fi

  pushd "${PROJECT_PATH}" >/dev/null
  make ci
  popd >/dev/null
  log "✅ ${LANGUAGE} CI build in ${PROJECT_PATH} completed."
}

# -----------------------------------------------------------------------------#
# 4) Timing helper — measure build duration in ms
# -----------------------------------------------------------------------------#

measure_build_ms() {
  local __result_var="$1"
  local mode_label="$2"
  local clean_caches="${3:-false}"

  log "===== ${mode_label} BUILD ====="

  if [[ "${clean_caches}" == "true" ]]; then
    log "Cleaning caches before ${mode_label} build..."
    mapfile -t paths < <(get_cold_cache_paths_for_language)
    if [[ "${#paths[@]}" -gt 0 ]]; then
      run_cache_clean "${paths[@]}"
    else
      log "No cache paths discovered for LANGUAGE=${LANGUAGE}; skipping clean."
    fi
  fi

  local start_ms end_ms duration_ms
  start_ms="$(date +%s%3N)"

  run_ci_build_for_language

  end_ms="$(date +%s%3N)"
  duration_ms=$((end_ms - start_ms))

  log "${mode_label} build duration: ${duration_ms} ms"
  printf -v "${__result_var}" '%s' "${duration_ms}"
}

# -----------------------------------------------------------------------------#
# 5) Execute cold + warm builds and compute improvements
# -----------------------------------------------------------------------------#

COLD_BUILD_MS=0
WARM_BUILD_MS=0

measure_build_ms COLD_BUILD_MS "COLD" "true"
measure_build_ms WARM_BUILD_MS "WARM" "false"

if ! [[ "${COLD_BUILD_MS}" =~ ^[0-9]+$ ]]; then
  die "Cold build duration not numeric: '${COLD_BUILD_MS}'"
fi
if ! [[ "${WARM_BUILD_MS}" =~ ^[0-9]+$ ]]; then
  die "Warm build duration not numeric: '${WARM_BUILD_MS}'"
fi

log "Cold ms = ${COLD_BUILD_MS}"
log "Warm ms = ${WARM_BUILD_MS}"

export COLD_BUILD_MS WARM_BUILD_MS MIN_IMPROVEMENT_PCT

IMPROVEMENT_PCT="$(
python - << 'PY'
import os
cold = float(os.environ["COLD_BUILD_MS"])
warm = float(os.environ["WARM_BUILD_MS"])
if cold <= 0:
    improvement = 0.0
else:
    improvement = round((cold - warm) / cold * 100.0, 2)
print(improvement)
PY
)"

log "Improvement % = ${IMPROVEMENT_PCT}"

# 🔧 FIX: export IMPROVEMENT_PCT so the next Python block can read it.
export IMPROVEMENT_PCT

BENCHMARK_STATUS="$(
python - << 'PY'
import os
imp = float(os.environ["IMPROVEMENT_PCT"])
min_req = float(os.environ.get("MIN_IMPROVEMENT_PCT", "30"))
if imp >= min_req:
    print("PASS")
else:
    print("FAIL")
PY
)"

log "Benchmark status = ${BENCHMARK_STATUS}"

# -----------------------------------------------------------------------------#
# 6) Persist results: ENV, JSON, Markdown
# -----------------------------------------------------------------------------#

LATEST_ENV="${CACHE_BENCH_OUTPUT_DIR}/latest-${LANGUAGE}.env"
JSON_FILE="${CACHE_BENCH_OUTPUT_DIR}/${TIMESTAMP}-${LANGUAGE}.json"

cat > "${LATEST_ENV}" <<EOF
LANGUAGE=${LANGUAGE}
COLD_BUILD_MS=${COLD_BUILD_MS}
WARM_BUILD_MS=${WARM_BUILD_MS}
IMPROVEMENT_PCT=${IMPROVEMENT_PCT}
BENCHMARK_STATUS=${BENCHMARK_STATUS}
TIMESTAMP=${TIMESTAMP}
EOF

log "Wrote latest env metrics to ${LATEST_ENV}"

cat > "${JSON_FILE}" <<EOF
{
  "language": "${LANGUAGE}",
  "cold_build_ms": ${COLD_BUILD_MS},
  "warm_build_ms": ${WARM_BUILD_MS},
  "improvement_pct": ${IMPROVEMENT_PCT},
  "status": "${BENCHMARK_STATUS}",
  "timestamp": "${TIMESTAMP}"
}
EOF

log "Wrote JSON metrics to ${JSON_FILE}"

if [[ ! -f "${HISTORY_MD}" ]]; then
  cat > "${HISTORY_MD}" <<EOF
# Cache Benchmark History

| Timestamp (UTC) | Language | Cold Build (ms) | Warm Build (ms) | Improvement (%) | Status |
|-----------------|----------|-----------------|-----------------|-----------------|--------|
EOF
fi

echo "| ${TIMESTAMP} | ${LANGUAGE} | ${COLD_BUILD_MS} | ${WARM_BUILD_MS} | ${IMPROVEMENT_PCT}% | ${BENCHMARK_STATUS} |" >> "${HISTORY_MD}"

log "Appended Markdown summary to ${HISTORY_MD}"
log "Benchmark script completed for LANGUAGE=${LANGUAGE}."

# Exit 0 – the caller workflow decides whether to fail based on status.
exit 0
