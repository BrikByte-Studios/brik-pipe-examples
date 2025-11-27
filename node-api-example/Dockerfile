# Based on: .github/templates/Dockerfile.node
# Service: Node API Example

# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/app

FROM node:${NODE_VERSION}-slim AS builder
WORKDIR ${APP_DIR}

COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

COPY . .

# This example assumes build output remains in src/ (no separate dist)
# If you add a build step later, adjust accordingly.
RUN if npm run | grep -q "build"; then \
      npm run build; \
    else \
      echo "ℹ️ No build script detected; skipping build step."; \
    fi

FROM node:${NODE_VERSION}-slim AS runtime

ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/app

ENV NODE_ENV=production

RUN useradd --create-home --shell /sbin/nologin appuser
WORKDIR ${APP_DIR}

COPY --from=builder ${APP_DIR}/package*.json ./
COPY --from=builder ${APP_DIR}/node_modules ./node_modules
COPY --from=builder ${APP_DIR}/src ./src

LABEL org.opencontainers.image.title="Node API Example" \
      org.opencontainers.image.description="Example Node.js API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

USER appuser
EXPOSE 8080

CMD ["node", "src/index.js"]
