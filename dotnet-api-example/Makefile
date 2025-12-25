# -----------------------------------------------------------------------------
# Makefile — .NET API Example
#
# Repo:
#   - brik-pipe-examples/dotnet-api-example
#
# Purpose:
#   Canonical build/test/ci commands for .NET projects.
#
# Layout:
#   - dotnet-api-example.sln
#   - src/BrikByte.DotNetApiExample/
#   - tests/BrikByte.DotNetApiExample.Tests/
#
# Targets:
#   - make build : dotnet build (Release)
#   - make test  : dotnet test  (Release)
#   - make ci    : build + test
# -----------------------------------------------------------------------------

SHELL := /usr/bin/bash
.ONESHELL:
.SHELLFLAGS := -euo pipefail -c

DOTNET        ?= dotnet
SOLUTION_FILE := dotnet-api-example.sln
CONFIG        := Release
TEST_RESULTS_DIR := TestResults

OUT_DIR         ?= out
TRX_FILE        ?= $(TEST_RESULTS_DIR)/TestResult.trx
JUNIT_FILE      ?= $(OUT_DIR)/junit.xml
UNIT_SHARD       ?= 1
UNIT_SHARD_TOTAL ?= 1

.PHONY: help restore build test ci clean

help:
	@echo ".NET API Example — Make targets"
	@echo "  make restore - dotnet restore on solution"
	@echo "  make build   - dotnet build (Release)"
	@echo "  make test    - dotnet test (Release)"
	@echo "  make ci      - restore + build + test"
	@echo "  make clean   - dotnet clean"

restore:
	@echo "📦 Restoring .NET dependencies..."
	$(DOTNET) restore $(SOLUTION_FILE)

build: restore
	@echo "🏗️ Building .NET solution (Release)..."
	$(DOTNET) build $(SOLUTION_FILE) --configuration $(CONFIG) --no-restore

test: build
	@echo "🧪 Running .NET tests (Release, excluding Integration) + coverage..."
	@echo "🧩 Shard: $(UNIT_SHARD)/$(UNIT_SHARD_TOTAL)"
	@echo "📌 TEST_ITEMS_FILE: $${TEST_ITEMS_FILE:-<none>}"

	@mkdir -p "$(TEST_RESULTS_DIR)" "$(OUT_DIR)"

	@projects=""; \
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then \
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"; \
	  projects="$$(sed '/^[[:space:]]*$$/d' "$${TEST_ITEMS_FILE}" | sort -u)"; \
	else \
	  echo "📌 Discovering test projects under ./tests (deterministic)"; \
	  projects="$$(find . -type f -name '*.csproj' -path './tests/*' | sort)"; \
	fi; \

	if [ -z "$$projects" ]; then \
	  echo "⚠️ No test projects found/selected."; \
	  echo "ℹ️ Writing empty JUnit for shard $(UNIT_SHARD) and exiting 0."; \
	  mkdir -p "$(OUT_DIR)"; \
	  : > "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"; \
	  exit 0; \
	fi; \

	selected="$$projects"; \
	if [ -z "$${TEST_ITEMS_FILE:-}" ] || [ ! -f "$${TEST_ITEMS_FILE}" ]; then \
	  shard=$$(printf "%s" "$(UNIT_SHARD)" | tr -d '\r'); \
	  total=$$(printf "%s" "$(UNIT_SHARD_TOTAL)" | tr -d '\r'); \
	  if [ "$$total" -lt 1 ]; then total=1; fi; \
	  if [ "$$shard" -lt 1 ]; then shard=1; fi; \
	  if [ "$$shard" -gt "$$total" ]; then shard=$$total; fi; \
	  selected="$$(printf "%s\n" $$projects | awk -v s=$$(($$shard-1)) -v t=$$total '((NR-1)%t)==s{print}')"; \
	  if [ -z "$$selected" ]; then \
	    echo "ℹ️ No test projects selected for shard $$shard/$$total (nothing to run)."; \
	    echo "ℹ️ Writing empty JUnit for shard $(UNIT_SHARD) and exiting 0."; \
	    : > "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"; \
	    exit 0; \
	  fi; \
	fi; \

	echo "📦 Selected test projects:"; \
	printf "%s\n" "$$selected" | sed 's/^/  - /'; \

	for proj in $$selected; do \
	  name=$$(basename "$$proj" .csproj); \
	  trx="$(TEST_RESULTS_DIR)/TestResult.$$name.shard$(UNIT_SHARD).trx"; \
	  covbase="$(TEST_RESULTS_DIR)/coverage.net.$$name.shard$(UNIT_SHARD)."; \
	  echo "➡️ dotnet test $$proj (trx=$$trx)"; \
	  $(DOTNET) test "$$proj" \
	    --configuration $(CONFIG) \
	    --no-build \
	    --filter "Category!=Integration" \
	    --logger "trx;LogFileName=$$(basename "$$trx")" \
	    --results-directory "$(TEST_RESULTS_DIR)" \
	    /p:CollectCoverage=true \
	    /p:CoverletOutput="$$covbase" \
	    /p:CoverletOutputFormat=json; \
	done

	@echo "📄 Converting TRX → JUnit XML for audit-export (per shard)..."
	@rm -f "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"

	@if ! command -v trx2junit >/dev/null 2>&1; then \
	  echo "📦 Installing trx2junit dotnet tool..."; \
	  dotnet tool install -g trx2junit; \
	fi

	@PATH="$$PATH:$$HOME/.dotnet/tools"; \
	trx=$$(find "$(TEST_RESULTS_DIR)" -maxdepth 1 -name "TestResult.*.shard$(UNIT_SHARD).trx" | head -n 1 || true); \
	if [ -z "$$trx" ]; then \
	  echo "ℹ️ No TRX file found for shard $(UNIT_SHARD) (likely empty shard)."; \
	  : > "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"; \
	  echo "✅ Wrote empty JUnit to $(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"; \
	  exit 0; \
	fi; \
	echo "ℹ️ Converting TRX: $$trx"; \
	trx2junit "$$trx" --output "$(OUT_DIR)"; \
	junit=$$(find "$(OUT_DIR)" -maxdepth 1 -name '*.xml' | head -n 1 || true); \
	if [ -z "$$junit" ]; then \
	  echo "❌ No JUnit XML produced by trx2junit in $(OUT_DIR)"; \
	  ls -R "$(OUT_DIR)"; \
	  exit 1; \
	fi; \
	mv "$$junit" "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"; \
	echo "✅ JUnit report written to $(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"


ci: test
	@echo "✅ CI pipeline (.NET) completed successfully."

clean:
	@echo "🧹 Cleaning .NET build output..."
	$(DOTNET) clean $(SOLUTION_FILE) --configuration $(CONFIG) || true
