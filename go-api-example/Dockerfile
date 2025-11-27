# ==============================================================================
# 🐹 Go API Multi-Stage Dockerfile (BrikByteOS Standard)
# ------------------------------------------------------------------------------
# Overview:
#   - Stage 1 (builder): Compiles a static Go binary using an alpine-based image
#   - Stage 2 (runtime): Runs that binary in a minimal distroless image (non-root)
#
# Assumptions:
#   - This folder contains:
#       • go.mod          (module definition)
#       • main.go or cmd/... (your main package)
#   - The built server listens on port :8080 inside the container.
#
# Usage:
#   docker build -t demo-go-app .
#   docker run -p 8003:8080 demo-go-app
#
#   → Host http://localhost:8003 → Container :8080
# ==============================================================================

# syntax=docker/dockerfile:1.7

# ------------------------------------------------------------------------------
# 🔧 Build-time Arguments
# ------------------------------------------------------------------------------
ARG GO_VERSION=1.22         # Go version to use for building
ARG APP_VERSION=dev         # App version injected into binary via ldflags
ARG GIT_COMMIT=local        # Commit SHA injected into binary via ldflags
ARG APP_DIR=/src            # Working directory inside builder container


# ==============================================================================
# 🏗 STAGE 1 — BUILDER
# - Compiles the Go binary with version metadata
# ==============================================================================

FROM golang:${GO_VERSION}-alpine AS builder

# Build statically linked Linux binary
ENV CGO_ENABLED=0 \
    GOOS=linux

# Re-declare APP_DIR so it’s available in this stage
ARG APP_DIR

# Build workspace
WORKDIR ${APP_DIR}

# Install git (some Go modules require VCS access)
RUN apk add --no-cache git

# ------------------------------------------------------------------------------
# Step 1: Copy module definition and download dependencies
# ------------------------------------------------------------------------------
# NOTE: We only copy go.mod, not go.sum, to avoid failing when go.sum
#       doesn't exist yet. go mod download will generate go.sum in-image.
COPY go.mod ./

# Download modules; caches deps based on go.mod
RUN go mod download

# ------------------------------------------------------------------------------
# Step 2: Copy source code and build the server binary
# ------------------------------------------------------------------------------
COPY . .

# Build optimized binary:
#   -s -w          → strip debug info, smaller binary
#   main.version   → version string set from build arg
#   main.commit    → git commit string set from build arg
RUN go build -ldflags="-s -w -X main.version=${APP_VERSION} -X main.commit=${GIT_COMMIT}" \
    -o /app/server ./...

# ==============================================================================
# 🚀 STAGE 2 — RUNTIME
# - Distroless image running as non-root for max security
# ==============================================================================

FROM gcr.io/distroless/static:nonroot AS runtime

ARG APP_VERSION=dev
ARG GIT_COMMIT=local

# Runtime working directory
WORKDIR /app

# Copy compiled binary from the builder image
COPY --from=builder /app/server ./server

# OCI labels for observability, traceability, and SBOM tooling
LABEL org.opencontainers.image.title="Go API Example" \
      org.opencontainers.image.description="Example Go API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

# Run as non-root (distroless provides nonroot user/group)
USER nonroot:nonroot

# Expose server port (change if your app uses a different port)
EXPOSE 8080

# Entry point — start the Go HTTP server
ENTRYPOINT ["./server"]
