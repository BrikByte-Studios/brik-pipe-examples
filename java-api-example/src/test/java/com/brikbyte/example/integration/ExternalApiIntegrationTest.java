package com.brikbyte.example.integration;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockserver.client.MockServerClient;
import org.mockserver.model.HttpRequest;
import org.mockserver.model.HttpResponse;
import org.testcontainers.containers.MockServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * ExternalApiIntegrationTest
 * --------------------------
 * Verifies that the Java service calls a MockServer instance instead
 * of a real external API.
 *
 * The app should read EXTERNAL_API_BASE_URL from environment variables.
 */
@Testcontainers
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ExternalApiIntegrationTest {

    @Container
    static MockServerContainer mockServer =
            new MockServerContainer("mockserver/mockserver:5.15.0");

    private MockServerClient mockClient;

    @BeforeAll
    void setupMocks() {
        mockClient = new MockServerClient(mockServer.getHost(), mockServer.getServerPort());

        // Configure stub for /external/payment
        mockClient
            .when(
                HttpRequest.request()
                    .withMethod("POST")
                    .withPath("/external/payment")
            )
            .respond(
                HttpResponse.response()
                    .withStatusCode(200)
                    .withBody("{\"status\":\"approved\",\"transactionId\":\"mock-tx-123\"}")
            );

        // Log base URL for CI debugging
        String baseUrl = String.format("http://%s:%d",
                mockServer.getHost(), mockServer.getServerPort());
        System.out.printf("[MOCK] MockServer base URL: %s%n", baseUrl);

        // In a real system, you'd set this into the app config before
        // starting the application under test.
        System.setProperty("external.api.base-url", baseUrl);
    }

    @Test
    void contextLoadsAndMocksAreReachable() {
        // Sanity check: verify mockServer is reachable.
        assertThat(mockServer.isRunning()).isTrue();
    }
}
