SHELL := /usr/bin/env bash
.SHELLFLAGS := -euo pipefail -c

# -----------------------------------------------------------------------------
# Node UI Example — Make targets
# - Supports BrikByteOS shard contract:
#     BRIK_SHARD_INDEX (0-based), BRIK_SHARD_TOTAL
# - Produces JUnit to:
#     test-artifacts/e2e/test-results/junit.xml
# - Works for Playwright and Cypress
# -----------------------------------------------------------------------------

NODE            ?= node
NPM             ?= npm

# Shard contract (0-based index)
BRIK_SHARD_INDEX ?= 0
BRIK_SHARD_TOTAL ?= 1

# Browser env contract (used by reusable workflow)
E2E_BROWSER     ?= chromium

# App URL (tests may read E2E_TARGET_URL / APP_BASE_URL)
E2E_TARGET_URL  ?= http://localhost:3000
APP_BASE_URL    ?= $(E2E_TARGET_URL)

# Artifacts
ARTIFACT_ROOT   ?= test-artifacts
E2E_RESULTS_DIR := $(ARTIFACT_ROOT)/e2e/test-results

# For Cypress sharding
CYPRESS_SPECS_GLOB ?= tests/e2e/cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}

.PHONY: help deps clean \
        playwright-install e2e-playwright e2e-playwright-ui \
        e2e-cypress e2e-cypress-chrome e2e-cypress-electron \
        e2e

help:
	@echo "Node UI Example — Make targets"
	@echo ""
	@echo "Setup:"
	@echo "  make deps                 - npm ci (or npm install if no lock)"
	@echo "  make playwright-install   - install Playwright browsers + deps"
	@echo ""
	@echo "E2E (Playwright):"
	@echo "  make e2e-playwright       - shard-aware Playwright run + JUnit"
	@echo "  make e2e-playwright-ui    - UI-ish variant (uses E2E_TARGET_URL) + JUnit"
	@echo ""
	@echo "E2E (Cypress):"
	@echo "  make e2e-cypress          - shard-aware Cypress run + JUnit (browser via E2E_BROWSER)"
	@echo "  make e2e-cypress-chrome   - Cypress Chrome (shard-aware) + JUnit"
	@echo "  make e2e-cypress-electron - Cypress Electron (shard-aware) + JUnit"
	@echo ""
	@echo "Alias:"
	@echo "  make e2e                  - defaults to Playwright (e2e-playwright)"
	@echo ""
	@echo "Shard contract env:"
	@echo "  BRIK_SHARD_INDEX (0-based), BRIK_SHARD_TOTAL"
	@echo ""
	@echo "URL env:"
	@echo "  E2E_TARGET_URL (default http://localhost:3000)"

deps:
	@echo "📦 Installing Node dependencies..."
	@if [ -f package-lock.json ]; then \
	  $(NPM) ci; \
	else \
	  $(NPM) install; \
	fi

playwright-install:
	@echo "🎭 Installing Playwright browsers (with deps)..."
	@$(NPM) run -s playwright:install

clean:
	@echo "🧹 Cleaning artifacts..."
	@rm -rf "$(ARTIFACT_ROOT)"

# -----------------------------------------------------------------------------
# Playwright: shard-aware execution + JUnit export
# - Playwright uses 1-based shard index in --shard=a/b, so we convert.
# -----------------------------------------------------------------------------
e2e-playwright:
	@mkdir -p "$(E2E_RESULTS_DIR)"
	@echo "🧪 Playwright E2E (shard-aware)"
	@echo "  BRIK_SHARD_INDEX=$(BRIK_SHARD_INDEX)"
	@echo "  BRIK_SHARD_TOTAL=$(BRIK_SHARD_TOTAL)"
	@echo "  E2E_TARGET_URL=$(E2E_TARGET_URL)"
	@shard_one_based="$$(($(BRIK_SHARD_INDEX) + 1))"; \
	total="$(BRIK_SHARD_TOTAL)"; \
	echo "  Playwright shard: $${shard_one_based}/$${total}"; \
	PLAYWRIGHT_JUNIT_OUTPUT_NAME="$(E2E_RESULTS_DIR)/junit.xml" \
	E2E_TARGET_URL="$(E2E_TARGET_URL)" \
	APP_BASE_URL="$(APP_BASE_URL)" \
	npx playwright test \
	  --shard="$${shard_one_based}/$${total}" \
	  --reporter=line,junit

e2e-playwright-ui:
	@mkdir -p "$(E2E_RESULTS_DIR)"
	@echo "🧪 Playwright E2E UI (shard-aware)"
	@shard_one_based="$$(($(BRIK_SHARD_INDEX) + 1))"; \
	total="$(BRIK_SHARD_TOTAL)"; \
	PLAYWRIGHT_JUNIT_OUTPUT_NAME="$(E2E_RESULTS_DIR)/junit.xml" \
	E2E_TARGET_URL="$(E2E_TARGET_URL)" \
	APP_BASE_URL="$(APP_BASE_URL)" \
	npx playwright test \
	  --shard="$${shard_one_based}/$${total}" \
	  --reporter=line,junit

# -----------------------------------------------------------------------------
# Cypress: shard by spec list (deterministic modulo split)
# - Writes JUnit to test-artifacts/e2e/test-results/junit.xml
# - Uses "cypress-multi-reporters"? Not required. Cypress has built-in junit reporter.
# -----------------------------------------------------------------------------
e2e-cypress:
	@mkdir -p "$(E2E_RESULTS_DIR)"
	@specs="$$(node scripts/cypress-select-specs.mjs)"; \
	if [ -z "$$specs" ]; then \
	  echo "ℹ️ No Cypress specs selected for shard $(BRIK_SHARD_INDEX)/$(BRIK_SHARD_TOTAL). Writing empty JUnit..."; \
	  printf "%s\n" \
	    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" \
	    "<testsuite name=\"cypress-e2e\" tests=\"0\" failures=\"0\" errors=\"0\" skipped=\"0\" time=\"0\"></testsuite>" \
	    > "$(E2E_RESULTS_DIR)/junit.xml"; \
	  exit 0; \
	fi; \
	JUNIT_PATH="$(E2E_RESULTS_DIR)/junit.xml"; \
	MOCHA_FILE="$$JUNIT_PATH" CYPRESS_baseUrl="$(E2E_TARGET_URL)" \
	npx cypress run --browser "$(E2E_BROWSER)" --spec "$$specs" \
	  --reporter junit \
	  --reporter-options "mochaFile=$$JUNIT_PATH,toConsole=true"




e2e-cypress-chrome:
	@$(MAKE) e2e-cypress E2E_BROWSER=chrome

e2e-cypress-electron:
	@$(MAKE) e2e-cypress E2E_BROWSER=electron

# Default alias (matches your reusable callers)
e2e: e2e-playwright
