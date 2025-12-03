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

.PHONY: help build test ci clean

help:
	@echo "Java API Example — Make targets"
	@echo "  make build  - Maven clean + package"
	@echo "  make test   - Maven test"
	@echo "  make ci     - Maven clean verify (CI-safe build+test)"
	@echo "  make clean  - Remove target/ directory"

build:
	@echo "🏗️ Building Java project with Maven..."
	$(MVN) -B clean package

test:
	@echo "🧪 Running Maven tests..."
	mkdir -p out
	$(MVN) -B \
	  -DskipTests=false \
	  -Dsurefire.printSummary=true \
	  -Dsurefire.reportFormat=xml \
	  -Dsurefire.reportsDirectory=out \
	  test
	$(MAKE) post-test

post-test:
	@echo "🔧 Merging JUnit XML into out/junit.xml..."
	@cat out/TEST-*.xml > out/junit.xml

ci:
	@echo "🚦 Running CI pipeline (Maven clean verify)..."
	$(MVN) -B clean verify
	@echo "✅ CI pipeline (Java) completed successfully."

clean:
	@echo "🧹 Cleaning Maven target directory..."
	rm -rf $(TARGET_DIR)
