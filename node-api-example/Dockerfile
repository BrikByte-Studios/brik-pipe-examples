# -----------------------------------------------------------------------------
# BrikByteOS v1 — Node Dockerfile Scaffold
#
# Goals:
# - Deterministic installs via lockfile
# - Cache-friendly: deps before source
# - Multi-stage: builder -> runtime
# - Non-root runtime
# - OCI labels via build args (traceability)
# -----------------------------------------------------------------------------

# ---- Base build args (used for labels; safe non-secret values only)
ARG IMAGE_SOURCE="unknown"
ARG VCS_REF="unknown"
ARG BUILD_DATE="unknown"

# ---- Builder stage
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---- Runtime stage
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

RUN useradd -m -u 10001 nodeapp

ARG IMAGE_SOURCE
ARG VCS_REF
ARG BUILD_DATE
LABEL org.opencontainers.image.source=$IMAGE_SOURCE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.title="brikbyte-node-service" \
      org.opencontainers.image.description="BrikByteOS v1 Node scaffold" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/server.js /app/server.js

USER 10001
EXPOSE 3000

# Start the server (binds PORT)
CMD ["node", "server.js"]
