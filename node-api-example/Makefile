SHELL := /usr/bin/bash
# -----------------------------------------------------------------------------
# Makefile — Node API Example
#
# Repo:
#   - brik-pipe-examples/node-api-example
#
# Purpose:
#   Provide canonical build/test/ci commands for Node.js projects that follow
#   BrikByteOS conventions and Runtime Matrix.
#
# Targets:
#   - make build : Build the Node.js app (npm run build)
#   - make test  : Run test suite (npm test)
#   - make ci    : CI-safe: clean → install deps → build → test
# -----------------------------------------------------------------------------

# Directories (conventions)
SRC_DIR   := src
TEST_DIR  := tests
BUILD_DIR := dist
ARTIFACT_ROOT ?= test-artifacts

# Default NPM commands (aligned with runtime-matrix)
NPM       := npm

.PHONY: help build test ci clean install lint lint-fix test-integration test-integration-smoke

help:
	@echo "Node API Example — Make targets"
	@echo "  make build   - Build the Node.js application (npm run build)"
	@echo "  make test    - Run test suite (npm test)"
	@echo "  make ci      - CI-safe pipeline: clean + install + build + test"
	@echo "  make install - Install dependencies (npm ci)"
	@echo "  make clean   - Remove build artifacts and node_modules cache (optional)"
	@echo "  make lint    - Run linter (npm run lint)"
	@echo "  make lint-fix- Auto-fix lint issues (npm run lint:fix)"


install:
	@echo "📦 Installing Node dependencies via npm ci (including dev deps)..."
	NODE_ENV=development $(NPM) ci --include=dev

build:
	@echo "🏗️ Building Node.js application..."
	$(NPM) run build

lint: install
	@set -euo pipefail; \
	echo "🧹 Linting Node.js project..."; \
	$(NPM) run lint

lint-fix: install
	@set -euo pipefail; \
	echo "🛠️ Lint fixing Node.js project..."; \
	$(NPM) run lint:fix

test: install
	@set -euo pipefail; \
	echo "🧪 Running Node.js unit tests..."; \
	echo "📁 CWD: $$(pwd)"; \
	if [ ! -d tests/unit ]; then \
	  echo "❌ tests/unit not found. Listing repo tree:"; \
	  ls -la; \
	  find . -maxdepth 3 -type d \( -name "tests" -o -name "__tests__" \) || true; \
	  exit 1; \
	fi; \
	SHARD="$${UNIT_SHARD:-1}"; \
	TOTAL="$${UNIT_SHARD_TOTAL:-1}"; \
	echo "🧩 Shard: $$SHARD/$$TOTAL"; \
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then \
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"; \
	  LIST="$$(sed '/^[[:space:]]*$$/d' "$${TEST_ITEMS_FILE}")"; \
	else \
	  echo "📌 Using repo sharder: scripts/shard-tests.cjs"; \
	  LIST="$$(node scripts/shard-tests.cjs tests/unit "$$SHARD" "$$TOTAL")"; \
	fi; \
	if [ -z "$$LIST" ]; then \
	  echo "ℹ️ No tests selected for shard $$SHARD/$$TOTAL (nothing to run)."; \
	  exit 0; \
	fi; \
	echo "📄 Selected test files ($$(echo "$$LIST" | wc -l | tr -d ' ')):"; \
	echo "$$LIST" | sed 's/^/  - /'; \
	ARTIFACT_ROOT="$(ARTIFACT_ROOT)"; \
	mkdir -p "$$ARTIFACT_ROOT/test-results" "$$ARTIFACT_ROOT/coverage"; \
	FILES_OR_GLOB="$$(printf "%s\n" "$$LIST" | tr '\n' ' ')"; \
	TEST_FILES="$$FILES_OR_GLOB" ARTIFACT_ROOT="$$ARTIFACT_ROOT" $(NPM) run test:shard

# --- Integration tests (BrikByteOS convention)
test-integration: install
	@set -euo pipefail; \
	echo "🧪 Running Node.js integration tests..."; \
	echo "📁 CWD: $$(pwd)"; \
	ARTIFACT_ROOT="$${GITHUB_WORKSPACE:-$$(pwd)}/test-artifacts"; \
	mkdir -p "$$ARTIFACT_ROOT/integration/test-results"; \
	APP_BASE_URL="$${APP_BASE_URL:-http://localhost:3000}"; \
	echo "🌐 APP_BASE_URL=$$APP_BASE_URL"; \
	# Run integration tests (node:test) \
	APP_BASE_URL="$$APP_BASE_URL" $(NPM) run test:integration; \
	# Normalize JUnit path for BrikByte parsers \
	if [ -f "$$ARTIFACT_ROOT/test-results/junit.xml" ]; then \
	  cp "$$ARTIFACT_ROOT/test-results/junit.xml" "$$ARTIFACT_ROOT/integration/test-results/junit.xml"; \
	fi

test-integration-smoke: install
	@set -euo pipefail; \
	echo "🧪 Running Node.js integration smoke tests..."; \
	ARTIFACT_ROOT="$${GITHUB_WORKSPACE:-$$(pwd)}/test-artifacts"; \
	mkdir -p "$$ARTIFACT_ROOT/integration/test-results"; \
	APP_BASE_URL="$${APP_BASE_URL:-http://localhost:3000}"; \
	echo "🌐 APP_BASE_URL=$$APP_BASE_URL"; \
	APP_BASE_URL="$$APP_BASE_URL" $(NPM) run test:integration:smoke; \
	if [ -f "$$ARTIFACT_ROOT/test-results/junit.xml" ]; then \
	  cp "$$ARTIFACT_ROOT/test-results/junit.xml" "$$ARTIFACT_ROOT/integration/test-results/junit.xml"; \
	fi


ci: clean install build test
	@echo "✅ CI pipeline (Node) completed successfully."

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf $(BUILD_DIR) node_modules coverage
