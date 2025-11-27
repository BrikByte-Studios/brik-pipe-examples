# ==============================================================================
# 🐍 FastAPI / Python API Multi-Stage Dockerfile (BrikByteOS Standard)
# ------------------------------------------------------------------------------
# Overview:
#   - Stage 1 (builder): Installs dependencies into a clean Python layer
#   - Stage 2 (runtime): Copies only final dependencies + source to keep image small
#
# Key Principles:
#   • Multi-stage = faster, smaller, secure production images
#   • Dependencies installed only once (cached if requirements.txt unchanged)
#   • Non-root runtime user enforced (security best practice)
#   • Uvicorn used as ASGI server for FastAPI
#
# Required Project Layout:
#   ./main.py  → must contain FastAPI instance named `app`
#   ./requirements.txt → must include "fastapi" and "uvicorn[standard]"
#
# Run:
#   docker build -t demo-python-app .
#   docker run -p 8080:8080 demo-python-app
#
# Access API:
#   http://localhost:8080
#   http://localhost:8080/docs   → Swagger UI
# ==============================================================================

# Enable Dockerfile modern syntax
# (BuildKit, heredocs, caching improvements)
# syntax=docker/dockerfile:1.7


# ------------------------------------------------------------------------------
# 🔧 Build Arguments — overridable via CI/CD or manual build
# ------------------------------------------------------------------------------
ARG PYTHON_VERSION=3.11   # Python runtime version
ARG APP_VERSION=dev       # Image version/tag injected by pipeline
ARG GIT_COMMIT=local      # Commit SHA for traceability
ARG APP_DIR=/app          # Application directory used across both stages


# ==============================================================================
# 📦 STAGE 1 — BUILDER: Installs dependencies inside an isolated environment
# ==============================================================================

FROM python:${PYTHON_VERSION}-slim AS builder

# Prevent bytecode (*.pyc) generation & force unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Re-import build arg into this stage
ARG APP_DIR

# Set build working directory
WORKDIR ${APP_DIR}

# -------------------------
# Dependency Installation
# -------------------------
# Copy requirements first → allows Docker layer caching
COPY requirements.txt ./

# Install Python dependencies inside builder image
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy project source after dependencies to maximize caching
COPY . .


# ==============================================================================
# 🏃 STAGE 2 — RUNTIME: Minimal and secure execution environment
# ==============================================================================

FROM python:${PYTHON_VERSION}-slim AS runtime

# Re-declare args for use within runtime layer
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/app

# Ensure logs flush immediately + cleaner runtime behavior
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:${PATH}"

# Create non-root user for production hardening
RUN useradd --create-home --shell /usr/sbin/nologin appuser

# Set working directory for application at runtime
WORKDIR ${APP_DIR}

# -------------------------
# Copy Python runtime deps
# -------------------------
# Only copy installed site-packages and uvicorn binary — reduces final image size
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/

# Copy actual FastAPI application code
COPY --from=builder ${APP_DIR} .

# OCI-compliant metadata for traceability in registries
LABEL org.opencontainers.image.title="Python API Example" \
      org.opencontainers.image.description="Example FastAPI service for BrikByteOS" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

# Drop root → run as non-privileged user
USER appuser

# Expose API port externally (matches uvicorn --port)
EXPOSE 8080

# ------------------------------------------------------------------------------
# 🚀 Entrypoint — starts FastAPI server using Uvicorn ASGI
# ------------------------------------------------------------------------------
# If your entry file is not main.py, change to:
# CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
# ------------------------------------------------------------------------------
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
