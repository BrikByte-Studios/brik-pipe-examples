# -----------------------------------------------------------------------------
# Makefile — Java API Example (Spring Boot / Maven)
#
# Repo:
#   - brik-pipe-examples/java-api-example
#
# Purpose:
#   Canonical build/test/ci commands for Java projects using Maven.
#
# Targets:
#   - make build : mvn -B clean package
#   - make test  : mvn -B test (shard-aware, unit tests only)
#   - make ci    : deps → lint → build → test
# -----------------------------------------------------------------------------

MVN          ?= mvn

# CI-hardening + deterministic local Maven repo (inside workspace for caching)
MVN_FLAGS ?= -B \
  -Dmaven.wagon.http.retryHandler.count=3 \
  -Dmaven.wagon.http.retryHandler.requestSentEnabled=true \
  -Dmaven.wagon.httpconnectionManager.ttlSeconds=25 \
  -Dhttp.keepAlive=false \
  -Dmaven.repo.local=$(CURDIR)/.m2/repository

POM_FILE     := pom.xml
TARGET_DIR   := target
SHELL := /usr/bin/env bash
.SHELLFLAGS := -euo pipefail -c

.PHONY: help deps lint build test post-test ci clean

help:
	@echo "Java API Example — Make targets"
	@echo "  make deps   - Resolve Maven dependencies"
	@echo "  make lint   - Static verification (compile + plugins, no tests)"
	@echo "  make build  - Maven clean + package"
	@echo "  make test   - Maven unit tests (shard-aware)"
	@echo "  make ci     - deps → lint → build → test"
	@echo "  make clean  - Remove target/ directory"

# --------------------------------------------------------------------
# Dependency resolution (fast, deterministic)
# --------------------------------------------------------------------
deps:
	@echo "📦 Resolving Maven dependencies..."
	$(MVN) $(MVN_FLAGS) dependency:resolve

# --------------------------------------------------------------------
# Lint / Static verification (PIPE-CORE-1.1.3 contract)
# This is where Checkstyle / SpotBugs / PMD will live.
# --------------------------------------------------------------------
lint:
	@echo "🧹 Running Maven static verification (lint)..."
	$(MVN) $(MVN_FLAGS) -DskipTests verify

# --------------------------------------------------------------------
# Build (artifact creation)
# --------------------------------------------------------------------
build:
	@echo "🏗️ Building Java project with Maven..."
	$(MVN) $(MVN_FLAGS) clean package

# --------------------------------------------------------------------
# Test (shard-aware) — UNIT tests only
#  - Excludes integration tests by name and folder to avoid forcing them via -Dtest
# --------------------------------------------------------------------
test: deps
	@set -euo pipefail; \
	echo "🧪 Running Maven tests..."; \
	echo "🧩 Shard: $${UNIT_SHARD:-1}/$${UNIT_SHARD_TOTAL:-1}"; \
	mkdir -p out; \
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then \
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"; \
	  files="$$(sed '/^[[:space:]]*$$/d' "$${TEST_ITEMS_FILE}")"; \
	else \
	  echo "📌 Discovering UNIT tests under src/test/java (recursive)"; \
	  files="$$(find src/test/java -type f \
	    \( -name '*Test.java' -o -name '*Tests.java' \) \
	    ! -name '*IT.java' \
	    ! -name '*IntegrationTest.java' \
	    ! -path '*/integration/*' \
	    2>/dev/null | sort || true)"; \
	  shard="$${UNIT_SHARD:-1}"; total="$${UNIT_SHARD_TOTAL:-1}"; \
	  if [ "$$total" -gt "1" ]; then \
	    files="$$(FILES="$$files" UNIT_SHARD="$$shard" UNIT_SHARD_TOTAL="$$total" \
	      python -c 'import os; fs=[f for f in os.environ.get("FILES","").splitlines() if f.strip()]; s=int(os.environ.get("UNIT_SHARD","1")); t=int(os.environ.get("UNIT_SHARD_TOTAL","1")); out=[f for n,f in enumerate(fs) if (n%t)==(s-1)]; print("\n".join(out))' \
	    )"; \
	  fi; \
	fi; \
	if [ -z "$$files" ]; then \
	  echo "ℹ️ No tests selected for this shard (nothing to run)."; \
	  exit 0; \
	fi; \
	echo "📄 Selected test files ($$(echo "$$files" | wc -l | tr -d ' ')):"; \
	echo "$$files" | sed 's/^/  - /'; \
	classes="$$(echo "$$files" | sed -E 's|^src/test/java/||; s|/|.|g; s|\.java$$||')"; \
	tests_csv="$$(echo "$$classes" | paste -sd, -)"; \
	echo "🧪 Surefire -Dtest=$$tests_csv"; \
	ARTIFACT_ROOT="$${GITHUB_WORKSPACE:-$$(pwd)}/test-artifacts"; \
	mkdir -p "$$ARTIFACT_ROOT/test-results"; \
	$(MVN) $(MVN_FLAGS) \
		-Dtest="$$tests_csv" \
		-Dsurefire.reportsDirectory="$$ARTIFACT_ROOT/test-results/surefire" \
		test
	$(MAKE) post-test

post-test:
	@set -euo pipefail; \
	ARTIFACT_ROOT="$${GITHUB_WORKSPACE:-$$(pwd)}/test-artifacts"; \
	SUREFIRE_DIR="$$ARTIFACT_ROOT/test-results/surefire"; \
	JUNIT_CANON="$$ARTIFACT_ROOT/test-results/junit.xml"; \
	echo "🔧 Merging Surefire JUnit XML into $$JUNIT_CANON..."; \
	mkdir -p "$$(dirname "$$JUNIT_CANON")"; \
	if ls "$$SUREFIRE_DIR"/TEST-*.xml >/dev/null 2>&1; then \
	  cat "$$SUREFIRE_DIR"/TEST-*.xml > "$$JUNIT_CANON"; \
	  echo "✅ Wrote $$JUNIT_CANON"; \
	else \
	  echo "::error::No TEST-*.xml found under $$SUREFIRE_DIR"; \
	  exit 2; \
	fi


# --------------------------------------------------------------------
# CI pipeline (PIPE-CORE-1.1.3 contract order)
# --------------------------------------------------------------------
ci: deps lint build test
	@echo "🚦 Running CI pipeline (deps → lint → build → test)..."
	@echo "✅ CI pipeline (Java) completed successfully."

clean:
	@echo "🧹 Cleaning Maven target directory..."
	rm -rf $(TARGET_DIR)
