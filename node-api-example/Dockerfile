services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app_test
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app_test"]
      interval: 3s
      timeout: 3s
      retries: 40
    volumes:
      - ./integration/seed/data:/docker-entrypoint-initdb.d:ro

  mock:
    image: wiremock/wiremock:3.9.1
    ports:
      - "8080:8080"
    volumes:
      - ./integration/mocks/wiremock/mappings:/home/wiremock/mappings:ro
      - ./integration/mocks/wiremock/__files:/home/wiremock/__files:ro
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8080/__admin/health | grep -q '\"status\"'"]
      interval: 3s
      timeout: 3s
      retries: 40

  api:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        IMAGE_SOURCE: ${IMAGE_SOURCE:-unknown}
        VCS_REF: ${VCS_REF:-unknown}
        BUILD_DATE: ${BUILD_DATE:-unknown}
    environment:
      # App environment contract (adjust names to match your Node app)
      NODE_ENV: test
      PORT: "3000"

      # DB connectivity (internal compose DNS name = service name)
      TEST_DB_HOST: db
      TEST_DB_PORT: "5432"
      TEST_DB_NAME: app_test
      TEST_DB_USER: app
      TEST_DB_PASSWORD: app

      # WireMock base URL (internal)
      EXTERNAL_API_BASE_URL: http://mock:8080

    depends_on:
      db:
        condition: service_healthy
      mock:
        condition: service_healthy

    # Expose to host so CI runner can hit http://localhost:3000
    ports:
      - "3000:3000"

    # If your app has /health, keep this.
    # If not, either implement /health or change this check.
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health | grep -q '\"status\"'"]
      interval: 3s
      timeout: 3s
      retries: 40
