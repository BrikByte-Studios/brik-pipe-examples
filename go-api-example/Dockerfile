# Based on: .github/templates/Dockerfile.go

# syntax=docker/dockerfile:1.7

ARG GO_VERSION=1.22
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/src

FROM golang:${GO_VERSION}-alpine AS builder

ENV CGO_ENABLED=0 GOOS=linux

WORKDIR ${APP_DIR}

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -ldflags="-s -w -X main.version=${APP_VERSION} -X main.commit=${GIT_COMMIT}" \
    -o /app/server ./...

FROM gcr.io/distroless/static:nonroot AS runtime

ARG APP_VERSION=dev
ARG GIT_COMMIT=local

WORKDIR /app

COPY --from=builder /app/server ./server

LABEL org.opencontainers.image.title="Go API Example" \
      org.opencontainers.image.description="Example Go API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

USER nonroot:nonroot
EXPOSE 8080

ENTRYPOINT ["./server"]
