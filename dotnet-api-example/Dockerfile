# -----------------------------------------------------------------------------
# BrikByteOS v1 — .NET Dockerfile (Kaniko-safe, cache-friendly)
# -----------------------------------------------------------------------------

ARG IMAGE_SOURCE="unknown"
ARG VCS_REF="unknown"
ARG BUILD_DATE="unknown"

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /src

# Copy solution
COPY dotnet-api-example.sln ./

# Copy csproj files WHILE preserving their directories (explicit)
COPY src/BrikByte.DotNetApiExample/BrikByte.DotNetApiExample.csproj \
     src/BrikByte.DotNetApiExample/

COPY tests/BrikByte.DotNetApiExample.Tests/BrikByte.DotNetApiExample.Tests.csproj \
     tests/BrikByte.DotNetApiExample.Tests/

# Restore now works (projects exist at paths referenced by the .sln)
RUN dotnet restore dotnet-api-example.sln

# Copy everything else
COPY . .

# Publish explicitly
RUN dotnet publish src/BrikByte.DotNetApiExample/BrikByte.DotNetApiExample.csproj \
    -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

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
CMD ["dotnet", "BrikByte.DotNetApiExample.dll"]
