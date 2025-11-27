# Based on: .github/templates/Dockerfile.dotnet

# syntax=docker/dockerfile:1.7

ARG DOTNET_VERSION=8.0
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/src

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS builder

WORKDIR ${APP_DIR}

COPY *.sln ./
COPY src/ ./src/
COPY tests/ ./tests/

RUN dotnet restore
RUN dotnet build --configuration Release --no-restore
RUN dotnet publish src/BrikByte.DotNetApiExample/BrikByte.DotNetApiExample.csproj \
      --configuration Release \
      --no-restore \
      --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS runtime

ARG APP_VERSION=dev
ARG GIT_COMMIT=local

RUN useradd --create-home --shell /sbin/nologin appuser

WORKDIR /app

COPY --from=builder /app/publish .

LABEL org.opencontainers.image.title="DotNet API Example" \
      org.opencontainers.image.description="Example ASP.NET Core API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

USER appuser
EXPOSE 8080

ENTRYPOINT ["dotnet", "BrikByte.DotNetApiExample.dll"]
