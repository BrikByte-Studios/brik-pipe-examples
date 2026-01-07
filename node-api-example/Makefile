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

# Default NPM commands (aligned with runtime-matrix)
NPM       := npm

.PHONY: help build test ci clean install lint lint-fix

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
	@echo "📦 Installing Node dependencies via npm ci...."
	$(NPM) ci

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
	\
	SHARD="$${UNIT_SHARD:-1}"; \
	TOTAL="$${UNIT_SHARD_TOTAL:-1}"; \
	echo "🧩 Shard: $$SHARD/$$TOTAL"; \
	\
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then \
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"; \
	  LIST="$$(sed '/^[[:space:]]*$$/d' "$${TEST_ITEMS_FILE}")"; \
	else \
	  echo "📌 Using repo sharder: scripts/shard-tests.cjs"; \
	  LIST="$$(node scripts/shard-tests.cjs tests/unit "$$SHARD" "$$TOTAL")"; \
	fi; \
	\
	if [ -z "$$LIST" ]; then \
	  echo "ℹ️ No tests selected for shard $$SHARD/$$TOTAL (nothing to run)."; \
	  exit 0; \
	fi; \
	\
	echo "📄 Selected test files ($$(echo "$$LIST" | wc -l | tr -d ' ')):"; \
	echo "$$LIST" | sed 's/^/  - /'; \
	\
	ARTIFACT_ROOT="$${GITHUB_WORKSPACE:-$$(pwd)}/test-artifacts"; \
	mkdir -p "$$ARTIFACT_ROOT/test-results" "$$ARTIFACT_ROOT/coverage"; \

	TEST_FILES="$$LIST" npm run test:shard

ci: clean install build test
	@echo "✅ CI pipeline (Node) completed successfully."

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf $(BUILD_DIR) node_modules coverage
