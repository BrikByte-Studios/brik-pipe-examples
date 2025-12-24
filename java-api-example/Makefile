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
#   - make test  : mvn -B test
#   - make ci    : mvn -B clean verify (build + tests).
# -----------------------------------------------------------------------------

MVN          ?= mvn
POM_FILE     := pom.xml
TARGET_DIR   := target
SHELL := /usr/bin/env bash

.PHONY: help build test ci clean deps post-test

help:
	@echo "Java API Example — Make targets"
	@echo "  make build  - Maven clean + package"
	@echo "  make test   - Maven test"
	@echo "  make ci     - Maven clean verify (CI-safe build+test)"
	@echo "  make clean  - Remove target/ directory"

build:
	@echo "🏗️ Building Java project with Maven..."
	$(MVN) -B clean package

deps:
	@echo "📦 Resolving Maven dependencies..."
	$(MVN) -B dependency:resolve

test: deps
	@set -euo pipefail; \
	echo "🧪 Running Maven tests..."; \
	echo "🧩 Shard: $${UNIT_SHARD:-1}/$${UNIT_SHARD_TOTAL:-1}"; \
	mkdir -p out; \
	if [ -n "$${TEST_ITEMS_FILE:-}" ] && [ -f "$${TEST_ITEMS_FILE}" ]; then \
	  echo "📌 Using runner-provided selection file: $${TEST_ITEMS_FILE}"; \
	  files="$$(sed '/^[[:space:]]*$$/d' "$${TEST_ITEMS_FILE}")"; \
	else \
	  echo "📌 Discovering tests under src/test/java (recursive)"; \
	  files="$$(find src/test/java -type f \( -name '*Test.java' -o -name '*Tests.java' \) 2>/dev/null | sort || true)"; \
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
	$(MVN) -B -Dtest="$$tests_csv" test; \
	$(MAKE) post-test


post-test:
	@echo "🔧 Merging Surefire JUnit XML into out/junit.xml..."
	@mkdir -p out
	@if ls target/surefire-reports/TEST-*.xml >/dev/null 2>&1; then \
	  cat target/surefire-reports/TEST-*.xml > out/junit.xml; \
	  echo "✅ Wrote out/junit.xml from target/surefire-reports/TEST-*.xml"; \
	else \
	  echo "⚠️ No TEST-*.xml files found under target/surefire-reports; skipping JUnit merge."; \
	fi

ci:
	@echo "🚦 Running CI pipeline (Maven clean verify)..."
	$(MVN) -B clean verify
	@echo "✅ CI pipeline (Java) completed successfully."

clean:
	@echo "🧹 Cleaning Maven target directory..."
	rm -rf $(TARGET_DIR)
