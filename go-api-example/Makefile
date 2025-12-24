# -----------------------------------------------------------------------------
# Makefile — Go API Example
#
# Repo(s):
#   - BrikByte-Studios/brik-pipe-examples/go-api-example
#   - BrikByte-Studios/.github/go-api-example   (self-test mirror)
#
# Purpose:
#   Canonical build/test/ci commands for Go modules using go build & go test.
#
# Enhancements:
#   - Auto-installs `go-junit-report` if it is not available on PATH.
#   - Produces JUnit XML for both unit and (optional) integration tests.
#
# Targets:
#   - make build          : go build ./... (binary under bin/)
#   - make test-unit      : go test ./...  (unit tests only, + JUnit)
#   - make test-integration : go test with -tags=integration (if used)
#   - make test           : alias for test-unit
#   - make ci             : build + test
#   - make clean          : remove bin/
# -----------------------------------------------------------------------------
SHELL := /usr/bin/env bash
.ONESHELL:
.SHELLFLAGS := -euo pipefail -c


GO          ?= go
BIN_DIR     := bin
BUILD_OUT   := $(BIN_DIR)/app

# Shard contract (optional)
UNIT_SHARD ?= 1
UNIT_SHARD_TOTAL ?= 1

.PHONY: help build test-unit test-integration test ci clean

help:
	@echo "Go API Example — Make targets"
	@echo "  make build           - Build Go binary into $(BUILD_OUT)"
	@echo "  make test-unit       - Run go test ./... for UNIT tests + JUnit export"
	@echo "  make test-integration- Run go test ./... with -tags=integration + JUnit export"
	@echo "  make test            - Alias for test-unit"
	@echo "  make ci              - CI-safe: build + test-unit"
	@echo "  make clean           - Remove $(BIN_DIR)/ directory"

# Internal helper: ensure go-junit-report is installed on PATH.
# This is used by both test-unit and test-integration
ensure-go-junit-report:
	@echo "🔎 Checking for go-junit-report..."
	@if ! command -v go-junit-report >/dev/null 2>&1; then \
	  echo "📦 Installing go-junit-report via '$(GO) install github.com/jstemmer/go-junit-report/v2@latest'..."; \
	  $(GO) install github.com/jstemmer/go-junit-report/v2@latest; \
	  echo "✅ go-junit-report installed."; \
	else \
	  echo "✅ go-junit-report already available on PATH."; \
	fi

build:
	@echo "🏗️ Building Go binary..."
	mkdir -p $(BIN_DIR)
	$(GO) build -o $(BUILD_OUT) ./...

test-unit: ensure-go-junit-report
	echo "🧪 Running Go UNIT tests..."
	mkdir -p out

	shard="${UNIT_SHARD:-1}"
	total="${UNIT_SHARD_TOTAL:-1}"

	# 1) Prefer runner-provided package list (one pkg per line)
	if [ -n "${TEST_ITEMS_FILE:-}" ] && [ -f "${TEST_ITEMS_FILE}" ]; then
	  echo "📌 Using runner-provided selection file: ${TEST_ITEMS_FILE}"
	  pkgs="$(sed '/^[[:space:]]*$$/d' "${TEST_ITEMS_FILE}" | sort -u)"
	else
	  echo "📌 Discovering packages via 'go list ./...'"
	  pkgs="$(go list ./... | sort)"
	fi

	# 2) If no runner list, shard locally by package index (deterministic)
	if [ -z "${TEST_ITEMS_FILE:-}" ] || [ ! -f "${TEST_ITEMS_FILE}" ]; then
	  if [ "${total}" -gt 1 ]; then
	    pkgs="$(printf "%s\n" "${pkgs}" | awk -v t="${total}" -v s="${shard}" '((NR-1) % t) == (s-1)')"
	  fi
	fi

	if [ -z "${pkgs}" ]; then
	  echo "ℹ️ No packages selected for shard ${shard}/${total} (nothing to run)."
	  printf "mode: atomic\n" > coverage.out
	  : > out/test-unit-report.json
	  : > out/junit.xml
	  exit 0
	fi

	echo "🧩 Shard: ${shard}/${total}"
	echo "📦 Selected packages ($(printf "%s\n" "${pkgs}" | wc -l | tr -d ' ')):"
	printf "%s\n" "${pkgs}" | sed 's/^/  - /'

	go test $(printf "%s\n" "${pkgs}") \
	  -covermode=atomic \
	  -coverpkg=./... \
	  -coverprofile=coverage.out \
	  -json > out/test-unit-report.json

	go-junit-report < out/test-unit-report.json > out/junit.xml
	echo "✅ Wrote out/junit.xml and coverage.out"

# Optional: integration tests (only when explicitly run, and typically
# driven by the BrikPipe integration-test runner with -tags=integration).
test-integration: ensure-go-junit-report
	@echo "🧪 Running Go INTEGRATION tests..."
	mkdir -p out
	$(GO) test ./... \
		-tags=integration \
		-json > out/test-integration-report.json
	@echo "📄 Converting INTEGRATION test JSON → JUnit XML..."
	go-junit-report < out/test-integration-report.json > out/junit-integration.xml
	@echo "✅ INTEGRATION JUnit report written to out/junit-integration.xml"

# Default "test" is just unit tests for standard CI.
test: test-unit

ci: build test
	@echo "✅ CI pipeline (Go) completed successfully."

clean:
	@echo "🧹 Cleaning Go build artifacts..."
	rm -rf $(BIN_DIR) out coverage.out
