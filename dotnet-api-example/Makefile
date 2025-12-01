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

test: restore
	@echo "🧪 Running .NET tests (Release)..."
	$(DOTNET) test $(SOLUTION_FILE) \
		--configuration $(CONFIG) \
		--no-build \
		--logger "trx;LogFileName=TestResult.trx" \
		--results-directory $(TEST_RESULTS_DIR)

ci: build test
	@echo "✅ CI pipeline (.NET) completed successfully."

clean:
	@echo "🧹 Cleaning .NET build output..."
	$(DOTNET) clean $(SOLUTION_FILE) --configuration $(CONFIG) || true
