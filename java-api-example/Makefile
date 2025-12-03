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
#   - make ci    : mvn -B clean verify (build + tests)
# -----------------------------------------------------------------------------

MVN          ?= mvn
POM_FILE     := pom.xml
TARGET_DIR   := target

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
	@echo "🧪 Running Maven tests..."
	$(MVN) -B test
	@$(MAKE) post-test

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
