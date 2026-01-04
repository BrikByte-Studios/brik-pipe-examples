# -----------------------------------------------------------------------------
# BrikByteOS v1 — .NET Dockerfile Scaffold (Fixed)
#
# Goals:
# - Cache-friendly: restore using sln + csproj files first
# - Multi-stage: build/publish -> runtime
# - Non-root runtime
# - OCI labels via safe build args
# -----------------------------------------------------------------------------

ARG IMAGE_SOURCE="unknown"
ARG VCS_REF="unknown"
ARG BUILD_DATE="unknown"

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /src

# 1) Copy solution + project files FIRST for restore caching
COPY *.sln ./

# Copy csproj(s) while preserving expected folder layout
# IMPORTANT: include tests if the .sln references them.
COPY src/**/*.csproj ./src/
COPY tests/**/*.csproj ./tests/

# 2) Restore (solution restore is fine now that all referenced csproj exist)
RUN dotnet restore

# 3) Copy the remaining source
COPY . .

# 4) Publish explicitly (avoid ambiguity)
# NOTE: set this to your actual API project path.
ARG APP_PROJECT="src/BrikByte.DotNetApiExample/BrikByte.DotNetApiExample.csproj"
RUN dotnet publish "$APP_PROJECT" -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user
RUN useradd -m -u 10001 dotnetapp

ARG IMAGE_SOURCE
ARG VCS_REF
ARG BUILD_DATE
LABEL org.opencontainers.image.source=$IMAGE_SOURCE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.title="brikbyte-dotnet-service" \
      org.opencontainers.image.description="BrikByteOS v1 .NET scaffold" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY --from=builder /out /app

USER 10001
EXPOSE 8080

# NOTE: set to your assembly name.
CMD ["dotnet", "BrikByte.DotNetApiExample.dll"]
