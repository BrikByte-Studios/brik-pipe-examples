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

test:
	@echo "🧪 Running Go tests..."
	$(GO) test ./...

ci: build test
	@echo "✅ CI pipeline (Go) completed successfully."

clean:
	@echo "🧹 Cleaning Go build artifacts..."
	rm -rf $(BIN_DIR)
