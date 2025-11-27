# Based on: .github/templates/Dockerfile.java

# syntax=docker/dockerfile:1.7

ARG JAVA_VERSION=17
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
ARG APP_DIR=/workspace

FROM eclipse-temurin:${JAVA_VERSION}-jdk-jammy AS builder

WORKDIR ${APP_DIR}

COPY pom.xml mvnw* ./
COPY .mvn .mvn

RUN ./mvnw -B -ntp dependency:go-offline

COPY src ./src

RUN ./mvnw -B -ntp clean package -DskipTests=false

FROM eclipse-temurin:${JAVA_VERSION}-jre-jammy AS runtime

ARG APP_VERSION=dev
ARG GIT_COMMIT=local

RUN useradd --create-home --shell /sbin/nologin appuser

WORKDIR /app

COPY --from=builder /workspace/target/*.jar ./app.jar

LABEL org.opencontainers.image.title="Java API Example" \
      org.opencontainers.image.description="Example Java API for BrikByteOS" \
      org.opencontainers.image.source="https://github.com/BrikByte-Studios/brik-pipe-examples" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

USER appuser
EXPOSE 8080

ENTRYPOINT ["java","-jar","./app.jar"]
