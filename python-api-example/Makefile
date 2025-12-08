# -----------------------------------------------------------------------------
# Makefile — Python API Example
#
# Repo:
#   - brik-pipe-examples/python-api-example
#
# Purpose:
#   Canonical build/test/ci commands for Python services using pytest and
#   optional packaging via python -m build.
#
# Targets:
#   - make deps            : Install dependencies
#   - make build           : Build distribution artifacts (wheel/sdist) if config exists
#   - make test-unit       : Run unit tests only (exclude @pytest.mark.integration)
#   - make test-integration: Run integration tests only (@pytest.mark.integration)
#   - make test            : Alias for unit tests (for backwards compatibility)
#   - make ci              : CI-safe: deps → build → unit tests
# -----------------------------------------------------------------------------

PYTHON     ?= python
PIP        ?= pip

SRC_DIR    := .
TEST_DIR   := tests
BUILD_DIR  := dist

.PHONY: help deps build test test-unit test-integration ci clean

help:
	@echo "Python API Example — Make targets"
	@echo "  make deps            - Install dependencies from requirements.txt"
	@echo "  make build           - Build Python package (wheel/sdist) if pyproject/setup.py exists"
	@echo "  make test-unit       - Run unit tests only (exclude 'integration' mark)"
	@echo "  make test-integration- Run integration tests only (marked 'integration')"
	@echo "  make test            - Alias for test-unit"
	@echo "  make ci              - CI-safe: deps + build + test-unit"
	@echo "  make clean           - Remove build artifacts"

deps:
	@echo "📦 Installing Python dependencies..."
	$(PYTHON) -m pip install --upgrade pip
	if [ -f requirements.txt ]; then \
		$(PIP) install -r requirements.txt; \
	else \
		echo "ℹ️ No requirements.txt found; skipping dependency installation."; \
	fi

build:
	@echo "🏗️ Building Python package (if build configuration present)..."
	if [ -f pyproject.toml ] || [ -f setup.py ]; then \
		$(PYTHON) -m pip install build; \
		$(PYTHON) -m build; \
	else \
		echo "ℹ️ No pyproject.toml or setup.py found; skipping package build."; \
	fi

# -----------------------------
# Unit tests (default "test")
# -----------------------------
test-unit: deps
	@echo "🧪 Running Python UNIT tests (excluding 'integration' mark, ignoring tests/integration)..."
	@if ls $(TEST_DIR)/test_*.py >/dev/null 2>&1; then \
	  mkdir -p out; \
	  PYTHONPATH="$$(pwd):$$PYTHONPATH" pytest \
	    -q \
	    $(TEST_DIR) \
	    -m "not integration" \
	    --ignore=$(TEST_DIR)/integration \
	    --maxfail=1 \
	    --disable-warnings \
	    --junitxml=out/junit-unit.xml \
	    --cov=. \
	    --cov-report=term-missing \
	    --cov-report=xml:coverage-unit.xml \
	    --cov-report=json:out/coverage-unit.json; \
	else \
	  echo "ℹ️ No unit tests found; skipping pytest."; \
	fi

# Backwards-compatible alias
test: test-unit

test-integration: deps
	@echo "🌐 Running Python INTEGRATION tests (marked 'integration')..."
	@if ls $(TEST_DIR)/integration >/dev/null 2>&1; then \
	  mkdir -p out; \
	  PYTHONPATH="$$(pwd):$$PYTHONPATH" pytest \
	    $(TEST_DIR)/integration \
	    -m "integration" \
	    --maxfail=1 \
	    --disable-warnings \
	    --junitxml=out/junit-integration.xml; \
	else \
	  echo "ℹ️ No integration tests directory found; skipping integration pytest."; \
	fi


ci: deps build test-unit
	@echo "✅ CI pipeline (Python) completed successfully."

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf $(BUILD_DIR) build *.egg-info out coverage.xml coverage-unit.xml out/coverage-unit.json
