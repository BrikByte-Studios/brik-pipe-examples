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
.SHELLFLAGS := -euo pipefail -c

GO          ?= go
BIN_DIR     := bin
BUILD_OUT   := $(BIN_DIR)/app
GOLANGCI_LINT ?= golangci-lint
GOPATH_BIN      := $(shell $(GO) env GOPATH)/bin
GO_JUNIT_REPORT := $(GOPATH_BIN)/go-junit-report

# Shard contract (optional)
UNIT_SHARD ?= 1
UNIT_SHARD_TOTAL ?= 1

.PHONY: help build test-unit test-integration test ci clean install lint ensure-go-junit-report fmt

help:
	@echo "Go API Example — Make targets"
	@echo "  make build           - Build Go binary into $(BUILD_OUT)"
	@echo "  make test-unit       - Run go test ./... for UNIT tests + JUnit export"
	@echo "  make test-integration- Run go test ./... with -tags=integration + JUnit export"
	@echo "  make test            - Alias for test-unit"
	@echo "  make ci              - CI-safe: build + test-unit"
	@echo "  make clean           - Remove $(BIN_DIR)/ directory"
	

install:
	@echo "Go installing"
	$(GO) mod download

# Internal helper: ensure go-junit-report is installed on PATH.
# This is used by both test-unit and test-integration
ensure-go-junit-report:
	@echo "🔎 Checking for go-junit-report..."
	@if [ ! -x "$(GO_JUNIT_REPORT)" ]; then \
	  echo "📦 Installing go-junit-report to GOPATH/bin..."; \
	  $(GO) install github.com/jstemmer/go-junit-report/v2@latest; \
	  echo "✅ Installed: $(GO_JUNIT_REPORT)"; \
	else \
	  echo "✅ go-junit-report already present: $(GO_JUNIT_REPORT)"; \
	fi

fmt:
	@echo "🛠️ Formatting Go files..."
	gofmt -w .

lint: fmt
	@echo "🔎 Linting Go code (gofmt check + go vet)..."
	@set -euo pipefail; \
	files="$$(find . -name '*.go' -not -path './vendor/*' -print)"; \
	if [ -z "$$files" ]; then \
	  echo "ℹ️ No .go files found; skipping."; \
	  exit 0; \
	fi; \
	unformatted="$$(gofmt -l $$files)"; \
	if [ -n "$$unformatted" ]; then \
	  echo "❌ gofmt required on:"; \
	  echo "$$unformatted" | sed 's/^/  - /'; \
	  echo "👉 Run: gofmt -w <files>"; \
	  exit 1; \
	fi; \
	$(GO) vet ./...; \
	echo "✅ Go lint OK"



build:
	@echo "🏗️ Building Go binary..."
	mkdir -p $(BIN_DIR)
	$(GO) build -o $(BUILD_OUT) ./...

test-unit: ensure-go-junit-report
	@set -euo pipefail; \
	echo "🧪 Running Go UNIT tests..."; \
	ARTIFACT_ROOT="$$(pwd)/test-artifacts"; \
	mkdir -p "$$ARTIFACT_ROOT/test-results" "$$ARTIFACT_ROOT/coverage" "$$ARTIFACT_ROOT/test-results/raw"; \
	shard="$${UNIT_SHARD:-1}"; total="$${UNIT_SHARD_TOTAL:-1}"; \
	pkgs=""; \
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then \
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"; \
	  pkgs="$$(sed "/^[[:space:]]*$$/d" "$${TEST_ITEMS_FILE}" | sort -u || true)"; \
	else \
	  echo "📌 Discovering packages via '\''go list ./...'\''"; \
	  pkgs="$$( $(GO) list ./... | grep -v "/vendor/" | sort || true)"; \
	fi; \
	if [ -z "$${TEST_ITEMS_FILE:-}" ] || [ ! -f "$${TEST_ITEMS_FILE}" ]; then \
	  if [ "$$total" -gt 1 ]; then \
	    pkgs="$$(printf "%s\n" "$$pkgs" | awk -v t="$$total" -v s="$$shard" "((NR-1) % t) == (s-1)" || true)"; \
	  fi; \
	fi; \
	if [ -z "$$pkgs" ]; then \
	  echo "ℹ️ No packages selected for shard $$shard/$$total (nothing to run)."; \
	  printf "%s\n" "{\"schema_version\":\"go-test.json/v1\",\"note\":\"no packages selected\",\"shard\":{\"index\":$$shard,\"total\":$$total}}" > "$$ARTIFACT_ROOT/test-results/go-test.json"; \
	  printf "%s\n" "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" "<testsuite name=\"go-unit\" tests=\"0\" failures=\"0\" errors=\"0\" skipped=\"0\" time=\"0\"></testsuite>" > "$$ARTIFACT_ROOT/test-results/junit.xml"; \
	  echo "mode: atomic" > "$$ARTIFACT_ROOT/coverage/coverage.out"; \
	  exit 0; \
	fi; \
	echo "🧩 Shard: $$shard/$$total"; \
	echo "📦 Selected packages ($$(printf "%s\n" "$$pkgs" | wc -l | tr -d " ")):"; \
	printf "%s\n" "$$pkgs" | sed "s/^/  - /"; \
	$(GO) test $$(printf "%s\n" "$$pkgs") -covermode=atomic -coverpkg=./... -coverprofile="$$ARTIFACT_ROOT/coverage/coverage.out" -json > "$$ARTIFACT_ROOT/test-results/go-test.json"; \
	"$(GO_JUNIT_REPORT)" < "$$ARTIFACT_ROOT/test-results/go-test.json" > "$$ARTIFACT_ROOT/test-results/junit.xml" || true; \
	if [ ! -s "$$ARTIFACT_ROOT/test-results/junit.xml" ]; then \
	  echo "⚠️ junit.xml empty; writing fallback minimal JUnit."; \
	  printf "%s\n" \
	    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" \
	    "<testsuite name=\"go-unit\" tests=\"0\" failures=\"0\" errors=\"1\" skipped=\"0\" time=\"0\">" \
	    "  <testcase classname=\"go-unit\" name=\"junit-generation\">" \
	    "    <error message=\"junit.xml was empty; check go-test.json generation\"></error>" \
	    "  </testcase>" \
	    "</testsuite>" \
	    > "$$ARTIFACT_ROOT/test-results/junit.xml"; \
	fi; \
	echo "✅ Wrote $$ARTIFACT_ROOT/test-results/go-test.json, junit.xml, coverage/coverage.out"

# Optional: integration tests (only when explicitly run, and typically
# driven by the BrikPipe integration-test runner with -tags=integration).
test-integration: ensure-go-junit-report
	@echo "🧪 Running Go INTEGRATION tests..."
	@mkdir -p out
	@set +e; \
	$(GO) test ./... -tags=integration -json 2>&1 | tee out/test-integration-report.json; \
	test_rc=$${PIPESTATUS[0]}; \
	set -e; \
	echo "📄 Converting INTEGRATION test JSON → JUnit XML..."; \
	"$(GO_JUNIT_REPORT)" < out/test-integration-report.json > out/junit-integration.xml || true; \
	echo "✅ INTEGRATION JUnit report written to out/junit-integration.xml"; \
	exit $$test_rc

# Default "test" is just unit tests for standard CI.
test: test-unit

ci: build test
	@echo "✅ CI pipeline (Go) completed successfully."

clean:
	@echo "🧹 Cleaning Go build artifacts..."
	rm -rf $(BIN_DIR) out coverage.out
