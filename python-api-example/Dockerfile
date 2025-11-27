# Based on: .github/templates/Dockerfile.python

# syntax=docker/dockerfile:1.7

ARG PYTHON_VERSION=3.11
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/app

FROM python:${PYTHON_VERSION}-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR ${APP_DIR}

COPY requirements.txt ./
RUN python -m pip install --upgrade pip && \
    python -m pip install --no-cache-dir -r requirements.txt

COPY . .

FROM python:${PYTHON_VERSION}-slim AS runtime

ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd --create-home --shell /sbin/nologin appuser

WORKDIR ${APP_DIR}

COPY --from=builder /usr/local/lib/python*/site-packages /usr/local/lib/python*/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder ${APP_DIR} .

LABEL org.opencontainers.image.title="Python API Example" \
      org.opencontainers.image.description="Example Python API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

USER appuser
EXPOSE 8080

# Assuming FastAPI + Uvicorn in python-api-example
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
