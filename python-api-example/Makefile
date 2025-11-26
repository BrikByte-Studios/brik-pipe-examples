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
#   - make build : Build distribution artifacts (wheel/sdist) if config exists
#   - make test  : Run pytest tests
#   - make ci    : CI-safe: install deps → build → test
# -----------------------------------------------------------------------------

PYTHON     ?= python
PIP        ?= pip

SRC_DIR    := .
TEST_DIR   := tests
BUILD_DIR  := dist

.PHONY: help deps build test ci clean

help:
	@echo "Python API Example — Make targets"
	@echo "  make deps   - Install dependencies from requirements.txt"
	@echo "  make build  - Build Python package (wheel/sdist) if pyproject/setup.py exists"
	@echo "  make test   - Run pytest test suite"
	@echo "  make ci     - CI-safe: deps + build + test"
	@echo "  make clean  - Remove build artifacts"

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

test:
	@echo "🔧 Checking for tests..."
	@if ls tests/test_*.py >/dev/null 2>&1; then \
	  echo "🔧 Setting PYTHONPATH and running pytest..."; \
	  PYTHONPATH="$$(pwd):$$PYTHONPATH" pytest; \
	else \
	  echo "ℹ️ No tests found; skipping pytest."; \
	fi


ci: deps build test
	@echo "✅ CI pipeline (Python) completed successfully."

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf $(BUILD_DIR) build *.egg-info
