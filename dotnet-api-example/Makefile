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

DOTNET        ?= dotnet
SOLUTION_FILE := dotnet-api-example.sln
CONFIG        := Release
TEST_RESULTS_DIR := TestResults

OUT_DIR         ?= out
TRX_FILE        ?= $(TEST_RESULTS_DIR)/TestResult.trx
JUNIT_FILE      ?= $(OUT_DIR)/junit.xml

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
	@echo "🧪 Running .NET tests (Release) + coverage..."
	$(DOTNET) test $(SOLUTION_FILE) \
		--configuration $(CONFIG) \
		--no-build \
		--logger "trx;LogFileName=TestResult.trx" \
		--results-directory $(TEST_RESULTS_DIR) \
		/p:CollectCoverage=true \
		/p:CoverletOutput=$(TEST_RESULTS_DIR)/coverage.net. \
		/p:CoverletOutputFormat=\"json,opencover\"

	@echo "📄 Converting TRX → JUnit XML for audit-export..."
	@mkdir -p $(OUT_DIR)
	@if ! command -v trx2junit >/dev/null 2>&1; then \
	  echo "📦 Installing trx2junit dotnet tool..."; \
	  dotnet tool install -g trx2junit; \
	fi; \
	PATH="$$PATH:$$HOME/.dotnet/tools" trx2junit "$(TRX_FILE)" --output "$(JUNIT_FILE)"

	@echo "✅ JUnit report written to $(JUNIT_FILE)"

ci: test
	@echo "✅ CI pipeline (.NET) completed successfully."

clean:
	@echo "🧹 Cleaning .NET build output..."
	$(DOTNET) clean $(SOLUTION_FILE) --configuration $(CONFIG) || true
