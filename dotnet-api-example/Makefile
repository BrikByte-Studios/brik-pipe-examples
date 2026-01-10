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

DOTNET           ?= dotnet
SOLUTION_FILE    := dotnet-api-example.sln
CONFIG           := Release
TEST_RESULTS_DIR := TestResults
OUT_DIR          ?= out

UNIT_SHARD       ?= 1
UNIT_SHARD_TOTAL ?= 1
INTEG_SHARD       ?= 1
INTEG_SHARD_TOTAL ?= 1

.PHONY: help restore build test ci clean lint lint-fix test-integration

help:
	@echo ".NET API Example — Make targets"
	@echo "  make restore - dotnet restore on solution"
	@echo "  make build   - dotnet build (Release)"
	@echo "  make test    - dotnet test (Release, excludes Integration) + coverage (Cobertura) + canonical reports"
	@echo "  make ci      - restore + build + test"
	@echo "  make clean   - dotnet clean"
	@echo "  make lint    - dotnet-format check"
	@echo "  make lint-fix- dotnet-format apply"

restore:
	@echo "📦 Restoring .NET dependencies..."
	$(DOTNET) restore $(SOLUTION_FILE)

lint: restore
	@echo "🔎 Linting .NET solution (dotnet-format, no changes allowed)..."
	$(DOTNET) tool restore
	$(DOTNET) tool run dotnet-format $(SOLUTION_FILE) --check

lint-fix: restore
	@echo "🧹 Fixing .NET formatting (dotnet-format writes changes)..."
	$(DOTNET) tool restore
	$(DOTNET) tool run dotnet-format $(SOLUTION_FILE)

build: restore
	@echo "🏗️ Building .NET solution (Release)..."
	$(DOTNET) build $(SOLUTION_FILE) --configuration $(CONFIG) --no-restore

test: build
	@echo "🧪 Running .NET tests (Release, excluding Integration) + coverage (Cobertura)..."
	@echo "🧩 Shard: $(UNIT_SHARD)/$(UNIT_SHARD_TOTAL)"
	@echo "📌 TEST_ITEMS_FILE: $${TEST_ITEMS_FILE:-<none>}"

	# Contract roots (BrikByte Pipelines v1)
	ARTIFACT_ROOT="$${GITHUB_WORKSPACE:-$$(pwd)}/test-artifacts"
	TRX_CANON="$$ARTIFACT_ROOT/test-results/test-results.trx"
	mkdir -p "$(TEST_RESULTS_DIR)" "$(OUT_DIR)" "$$ARTIFACT_ROOT/test-results" "$$ARTIFACT_ROOT/coverage"

	projects=""
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"
	  projects="$$(sed '/^[[:space:]]*$$/d' "$${TEST_ITEMS_FILE}" | sort -u)"
	else
	  echo "📌 Discovering test projects under ./tests (deterministic)"
	  projects="$$(find . -type f -name '*.csproj' -path './tests/*' | sort)"
	fi

	if [ -z "$$projects" ]; then
	  echo "⚠️ No test projects found/selected."
	  echo "ℹ️ Writing empty TRX + empty JUnit and exiting 0."
	  : > "$$TRX_CANON"
	  mkdir -p "$(OUT_DIR)"
	  : > "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"
	  exit 0
	fi

	selected="$$projects"
	if [ -z "$${TEST_ITEMS_FILE:-}" ] || [ ! -f "$${TEST_ITEMS_FILE}" ]; then
	  shard=$$(printf "%s" "$(UNIT_SHARD)" | tr -d '\r')
	  total=$$(printf "%s" "$(UNIT_SHARD_TOTAL)" | tr -d '\r')
	  if [ "$$total" -lt 1 ]; then total=1; fi
	  if [ "$$shard" -lt 1 ]; then shard=1; fi
	  if [ "$$shard" -gt "$$total" ]; then shard=$$total; fi

	  selected="$$(printf "%s\n" $$projects | awk -v s=$$(($$shard-1)) -v t=$$total '((NR-1)%t)==s{print}')"

	  if [ -z "$$selected" ]; then
	    echo "ℹ️ No test projects selected for shard $$shard/$$total (nothing to run)."
	    echo "ℹ️ Writing empty TRX + empty JUnit and exiting 0."
	    : > "$$TRX_CANON"
	    : > "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"
	    exit 0
	  fi
	fi

	echo "📦 Selected test projects:"
	printf "%s\n" "$$selected" | sed 's/^/  - /'

	# Collect one deterministic canonical TRX + Cobertura coverage.
	# - TRX: we canonicalize by copying the *first* produced shard TRX to test-artifacts/test-results/test-results.trx
	# - Coverage: output Cobertura XML into test-artifacts/coverage/coverage.cobertura.xml (contract-canonical)
	#
	# Note: If multiple test projects run, coverlet may overwrite the same Cobertura file.
	#       For v1 examples, that’s acceptable. If you want per-project files later, suffix the filename.
	COV_CANON="$$ARTIFACT_ROOT/coverage/coverage.cobertura.xml"
	rm -f "$$COV_CANON" "$$TRX_CANON"

	first_trx=""

	for proj in $$selected; do
	  name=$$(basename "$$proj" .csproj)
	  trx="$(TEST_RESULTS_DIR)/TestResult.$$name.shard$(UNIT_SHARD).trx"
	  echo "➡️ dotnet test $$proj (trx=$$trx)"
	  $(DOTNET) test "$$proj" \
	    --configuration "$(CONFIG)" \
	    --no-build \
	    --filter "Category!=Integration" \
	    --logger "trx;LogFileName=$$(basename "$$trx")" \
	    --results-directory "$(TEST_RESULTS_DIR)" \
	    /p:CollectCoverage=true \
	    /p:CoverletOutput="$$COV_CANON" \
	    /p:CoverletOutputFormat=cobertura

	  if [ -z "$$first_trx" ] && [ -f "$$trx" ]; then
	    first_trx="$$trx"
	  fi
	done

	if [ -n "$$first_trx" ] && [ -f "$$first_trx" ]; then
	  cp "$$first_trx" "$$TRX_CANON"
	  echo "✅ Canonical TRX: $$first_trx -> $$TRX_CANON"
	else
	  echo "ℹ️ No TRX produced for shard $(UNIT_SHARD) (likely empty shard). Writing empty canonical TRX."
	  : > "$$TRX_CANON"
	fi

	@echo "📄 Converting TRX → JUnit XML for audit-export (per shard)..."
	rm -f "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"

	# Ensure trx2junit is available
	if ! command -v trx2junit >/dev/null 2>&1; then
	  echo "📦 Installing trx2junit dotnet tool..."
	  $(DOTNET) tool install -g trx2junit
	fi

	PATH="$$PATH:$$HOME/.dotnet/tools"
	if [ -s "$$TRX_CANON" ]; then
	  echo "ℹ️ Converting canonical TRX: $$TRX_CANON"
	  trx2junit "$$TRX_CANON" --output "$(OUT_DIR)"
	  junit=$$(find "$(OUT_DIR)" -maxdepth 1 -name '*.xml' | head -n 1 || true)
	  if [ -z "$$junit" ]; then
	    echo "❌ No JUnit XML produced by trx2junit in $(OUT_DIR)"
	    ls -R "$(OUT_DIR)" || true
	    exit 1
	  fi
	  mv "$$junit" "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"
	  echo "✅ JUnit report written to $(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"
	else
	  echo "ℹ️ Canonical TRX is empty; writing empty JUnit for shard $(UNIT_SHARD)."
	  : > "$(OUT_DIR)/junit-shard$(UNIT_SHARD).xml"
	fi

	@echo "✅ Done. Contract artifacts:"
	@echo "  - test-artifacts/test-results/test-results.trx"
	@echo "  - test-artifacts/coverage/coverage.cobertura.xml"
	@echo "  - out/junit-shard$(UNIT_SHARD).xml"

test-integration: build
	@echo "🧪 Running .NET INTEGRATION tests (Release, Category=Integration) + coverage + canonical reports"
	@echo "🧩 Shard: $(INTEG_SHARD)/$(INTEG_SHARD_TOTAL)"
	@echo "📌 TEST_ITEMS_FILE: $${TEST_ITEMS_FILE:-<none>}"

	# Contract roots (BrikByte Pipelines v1)
	ARTIFACT_ROOT="$${GITHUB_WORKSPACE:-$$(pwd)}/test-artifacts"
	RAW_DIR="$$ARTIFACT_ROOT/integration/test-results"
	TRX_CANON="$$RAW_DIR/test-results.trx"
	mkdir -p "$(TEST_RESULTS_DIR)" "$(OUT_DIR)" "$$RAW_DIR" "$$ARTIFACT_ROOT/integration/coverage"

	projects=""
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"
	  projects="$$(sed '/^[[:space:]]*$$/d' "$${TEST_ITEMS_FILE}" | sort -u)"
	else
	  echo "📌 Discovering test projects under ./tests (deterministic)"
	  projects="$$(find . -type f -name '*.csproj' -path './tests/*' | sort)"
	fi

	if [ -z "$$projects" ]; then
	  echo "⚠️ No test projects found/selected."
	  echo "ℹ️ Writing empty canonical TRX + empty JUnit and exiting 0."
	  : > "$$TRX_CANON"
	  : > "$(OUT_DIR)/junit-integration.xml"
	  exit 0
	fi

	selected="$$projects"
	if [ -z "$${TEST_ITEMS_FILE:-}" ] || [ ! -f "$${TEST_ITEMS_FILE}" ]; then
	  shard=$$(printf "%s" "$(INTEG_SHARD)" | tr -d '\r')
	  total=$$(printf "%s" "$(INTEG_SHARD_TOTAL)" | tr -d '\r')
	  if [ "$$total" -lt 1 ]; then total=1; fi
	  if [ "$$shard" -lt 1 ]; then shard=1; fi
	  if [ "$$shard" -gt "$$total" ]; then shard=$$total; fi

	  selected="$$(printf "%s\n" $$projects | awk -v s=$$(($$shard-1)) -v t=$$total '((NR-1)%t)==s{print}')"

	  if [ -z "$$selected" ]; then
	    echo "ℹ️ No test projects selected for shard $$shard/$$total (nothing to run)."
	    echo "ℹ️ Writing empty canonical TRX + empty JUnit and exiting 0."
	    : > "$$TRX_CANON"
	    : > "$(OUT_DIR)/junit-integration.xml"
	    exit 0
	  fi
	fi

	echo "📦 Selected integration test projects:"
	printf "%s\n" "$$selected" | sed 's/^/  - /'

	# Coverage (contract-canonical)
	COV_CANON="$$ARTIFACT_ROOT/integration/coverage/coverage.cobertura.xml"
	rm -f "$$COV_CANON" "$$TRX_CANON"

	first_trx=""
	rc=0

	# Run integration tests (Category=Integration)
	for proj in $$selected; do
	  name=$$(basename "$$proj" .csproj)
	  trx="$(TEST_RESULTS_DIR)/TestResult.$$name.integration.shard$(INTEG_SHARD).trx"
	  echo "➡️ dotnet test $$proj (trx=$$trx)"

	  set +e
	  $(DOTNET) test "$$proj" \
	    --configuration "$(CONFIG)" \
	    --no-build \
	    --filter "Category=Integration" \
	    --logger "trx;LogFileName=$$(basename "$$trx")" \
	    --results-directory "$(TEST_RESULTS_DIR)" \
	    /p:CollectCoverage=true \
	    /p:CoverletOutput="$$COV_CANON" \
	    /p:CoverletOutputFormat=cobertura
	  cmd_rc=$$?
	  set -e

	  if [ "$$cmd_rc" -ne 0 ]; then
	    rc=$$cmd_rc
	  fi

	  if [ -z "$$first_trx" ] && [ -f "$$trx" ]; then
	    first_trx="$$trx"
	  fi
	done

	# Canonical TRX (copy first TRX if available)
	if [ -n "$$first_trx" ] && [ -f "$$first_trx" ]; then
	  cp "$$first_trx" "$$TRX_CANON"
	  echo "✅ Canonical TRX: $$first_trx -> $$TRX_CANON"
	else
	  echo "ℹ️ No TRX produced for integration shard $(INTEG_SHARD). Writing empty canonical TRX."
	  : > "$$TRX_CANON"
	fi

	@echo "📄 Converting TRX → JUnit XML (integration)..."
	rm -f "$(OUT_DIR)/junit-integration.xml"

	# Ensure trx2junit is available
	if ! command -v trx2junit >/dev/null 2>&1; then
	  echo "📦 Installing trx2junit dotnet tool..."
	  $(DOTNET) tool install -g trx2junit
	fi

	PATH="$$PATH:$$HOME/.dotnet/tools"
	if [ -s "$$TRX_CANON" ]; then
	  trx2junit "$$TRX_CANON" --output "$(OUT_DIR)"
	  junit=$$(find "$(OUT_DIR)" -maxdepth 1 -name '*.xml' | head -n 1 || true)
	  if [ -z "$$junit" ]; then
	    echo "❌ No JUnit XML produced by trx2junit in $(OUT_DIR)"
	    ls -R "$(OUT_DIR)" || true
	    exit 1
	  fi
	  mv "$$junit" "$(OUT_DIR)/junit-integration.xml"
	  echo "✅ JUnit report written to $(OUT_DIR)/junit-integration.xml"
	else
	  echo "ℹ️ Canonical TRX is empty; writing empty JUnit."
	  : > "$(OUT_DIR)/junit-integration.xml"
	fi

	@echo "✅ Done. Integration contract artifacts:"
	@echo "  - $$TRX_CANON"
	@echo "  - $$COV_CANON"
	@echo "  - out/junit-integration.xml"

	# Propagate the real test failure (so CI fails when integration tests fail)
	exit $$rc

ci: test
	@echo "✅ CI pipeline (.NET) completed successfully."

clean:
	@echo "🧹 Cleaning .NET build output..."
	$(DOTNET) clean $(SOLUTION_FILE) --configuration $(CONFIG) || true
	@rm -rf "$(TEST_RESULTS_DIR)" "$(OUT_DIR)" test-artifacts || true
