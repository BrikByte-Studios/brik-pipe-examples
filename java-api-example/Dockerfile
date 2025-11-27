# ==============================================================================
# ☕ Java / Spring Boot API Multi-Stage Dockerfile (BrikByteOS Standard)
# ------------------------------------------------------------------------------
# Overview:
#   - Stage 1 (builder): Uses Maven image to compile + package the JAR
#   - Stage 2 (runtime): Uses lightweight JRE-only image to run the JAR
#
# Requirements:
#   - Java 17 project with:
#       • pom.xml
#       • src/main/java/...
#       • src/main/resources/...
#   - Produces a single fat JAR in target/*.jar (Spring Boot default)
#
# Run:
#   docker build -t demo-java-app .
#   docker run -p 8001:8080 demo-java-app
#
# Note:
#   - Container listens on port 8080 (Spring Boot default), so:
#       host:8001 → container:8080   (-p 8001:8080)
# ==============================================================================

# syntax=docker/dockerfile:1.7

# ------------------------------------------------------------------------------
# 🔧 Build Arguments
# ------------------------------------------------------------------------------
ARG JAVA_VERSION=17          # Java major version
ARG APP_VERSION=dev          # Image version (CI can override)
ARG GIT_COMMIT=local         # Commit SHA for traceability
ARG APP_DIR=/workspace       # Build working directory inside container


# ==============================================================================
# 🏗 STAGE 1 — BUILDER (Maven + JDK)
# - Compiles and packages the application
# ==============================================================================

# Use Maven image with Eclipse Temurin 17 as the builder
FROM maven:3.9-eclipse-temurin-17 AS builder

# Re-declare APP_DIR so it’s usable in this stage
ARG APP_DIR

# Set working directory where the build will happen
WORKDIR ${APP_DIR}

# ------------------------------------------------------------------------------
# Step 1: Copy pom.xml and pre-download dependencies
# ------------------------------------------------------------------------------
# Copy only the pom.xml first to leverage Docker layer caching.
# Dependencies are downloaded only when pom.xml changes.
COPY pom.xml ./

RUN mvn -B -ntp dependency:go-offline

# ------------------------------------------------------------------------------
# Step 2: Copy source code and build the JAR
# ------------------------------------------------------------------------------
COPY src ./src

# Clean & package the application; skip tests can be toggled as needed
RUN mvn -B -ntp clean package -DskipTests=false


# ==============================================================================
# 🚀 STAGE 2 — RUNTIME (JRE only)
# - Runs the packaged application JAR
# ==============================================================================

FROM eclipse-temurin:${JAVA_VERSION}-jre-jammy AS runtime

ARG APP_VERSION=dev
ARG GIT_COMMIT=local

# Create a non-root user for better security
RUN useradd --create-home --shell /usr/sbin/nologin appuser

# Application runtime directory
WORKDIR /app

# Copy the built JAR from the builder image
# Assumes a single fat JAR is produced (Spring Boot default)
COPY --from=builder /workspace/target/*.jar ./app.jar

# OCI image labels for metadata & traceability
LABEL org.opencontainers.image.title="Java API Example" \
      org.opencontainers.image.description="Example Java API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

# Drop privileges and run as non-root
USER appuser

# Expose Spring Boot default port
EXPOSE 8080

# Entry point to run the application
ENTRYPOINT ["java","-jar","./app.jar"]
