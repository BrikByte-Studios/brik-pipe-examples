# ==============================================================================
# 🧱 Multi-Stage Dockerfile for Node.js Services (BrikByteOS Standard)
# ------------------------------------------------------------------------------
# Stage 1: Builder  → installs dependencies + optionally runs "npm run build"
# Stage 2: Runtime  → minimal image for execution with non-root user
#
# Assumptions:
#   • Application source lives in /src/index.js               (as per your tree)
#   • No separate build output directory (build is optional)
#   • package.json + package-lock.json managed via npm CI
#
# Notes:
#   • If you later introduce "dist/" outputs → COPY dist/ instead of src/
#   • This template must remain lightweight, deterministic, and CI-friendly
# ==============================================================================

# syntax=docker/dockerfile:1.7   # Enables modern Dockerfile features like heredocs

# ------------------------------------------------------------------------------
# 🔧 Build Arguments (Configurable via CI/CD or docker build --build-arg)
# ------------------------------------------------------------------------------
# Global build args (defaults) – can be overridden by CI or docker build
ARG NODE_VERSION=20
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/app

# ==============================================================================
# 🏗  Stage 1 — Builder Layer
# Installs dependencies + optionally performs build step
# ==============================================================================

FROM node:${NODE_VERSION}-slim AS builder
# Re-declare APP_DIR in this stage so Docker makes it available here
ARG APP_DIR

# Set working directory to the app directory inside the container
WORKDIR ${APP_DIR}

# ------------------------------------------------------------------------------
# 📦 Copy manifest files first for layer caching
# - Faster rebuilds because dependencies reinstall only when package files change
# ------------------------------------------------------------------------------
COPY package*.json ./

# Install dependencies without dev packages to reduce final image size
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \                
    else \
      npm install --omit=dev; \
    fi

# Copy full source tree after dependency install
COPY . .

# ------------------------------------------------------------------------------
# 🏭 Optional build step — executes only if "npm run build" exists
# Ideal for transpilers (TypeScript, Babel, Vite, NextJS etc.)
# ------------------------------------------------------------------------------
RUN if npm run | grep -q "build"; then \
      npm run build; \
    else \
      echo "ℹ️ No build script detected; skipping build step."; \
    fi

# ==============================================================================
# 🚀 Stage 2 — Runtime Layer
# Lightweight runtime container with non-root user for security
# ==============================================================================
FROM node:${NODE_VERSION}-slim AS runtime

# Build Args re-declared (available only at build time unless exported as ENV)
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/app

# Production environment means logging & perf tuned for runtime
ENV NODE_ENV=production

# ------------------------------------------------------------------------------
# 👤 Create non-root runtime user (security best practice)
# ------------------------------------------------------------------------------
RUN useradd --create-home --shell /sbin/nologin appuser

# Working directory inside runtime container
WORKDIR ${APP_DIR}

# ------------------------------------------------------------------------------
# 📥 Pull minimal required assets from builder layer
# ------------------------------------------------------------------------------
COPY --from=builder ${APP_DIR}/package*.json ./
COPY --from=builder ${APP_DIR}/node_modules ./node_modules
COPY --from=builder ${APP_DIR}/src ./src
COPY --from=builder ${APP_DIR}/server.js ./server.js

# ------------------------------------------------------------------------------
# 🏷 OCI Metadata Labels (Read in Registries + SBOM Tooling)
# ------------------------------------------------------------------------------
LABEL org.opencontainers.image.title="Node API Example" \
      org.opencontainers.image.description="Example Node.js API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

# Switch to non-root application user
USER appuser

# Expose application port — update if your app listens on a different port
EXPOSE 8080

# ------------------------------------------------------------------------------
# 🏁 Entry Point
# Modify if your entry file changes (ex: dist/index.js after TypeScript build)
# ------------------------------------------------------------------------------
CMD ["node", "server.js"]
