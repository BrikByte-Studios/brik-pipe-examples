# -----------------------------------------------------------------------------
# Makefile — Go API Example
#
# Repo:
#   - brik-pipe-examples/go-api-example
#
# Purpose:
#   Canonical build/test/ci commands for Go modules using go build & go test.
#
# Targets:
#   - make build : go build ./... (binary under bin/)
#   - make test  : go test ./...
#   - make ci    : build + test
# -----------------------------------------------------------------------------

GO          ?= go
BIN_DIR     := bin
BUILD_OUT   := $(BIN_DIR)/app

.PHONY: help build test ci clean

help:
	@echo "Go API Example — Make targets"
	@echo "  make build  - Build Go binary into $(BUILD_OUT)"
	@echo "  make test   - Run go test ./..."
	@echo "  make ci     - CI-safe: build + test"
	@echo "  make clean  - Remove bin/ directory"

build:
	@echo "🏗️ Building Go binary..."
	mkdir -p $(BIN_DIR)
	$(GO) build -o $(BUILD_OUT) ./...

test-unit:
	@echo "🧪 Running Go UNIT tests..."
	mkdir -p out
	$(GO) test ./... -run '^(?!TestIntegration_)' -coverprofile=coverage.out -json > out/test-report.json
	go-junit-report < out/test-report.json > out/junit.xml

test: test-unit

test-integration:
	@echo "🧪 Running Go INTEGRATION tests..."
	mkdir -p out
	$(GO) test ./... -tags=integration -json > out/test-integration-report.json
	go-junit-report < out/test-integration-report.json > out/junit-integration.xml


ci: build test
	@echo "✅ CI pipeline (Go) completed successfully."

clean:
	@echo "🧹 Cleaning Go build artifacts..."
	rm -rf $(BIN_DIR)
