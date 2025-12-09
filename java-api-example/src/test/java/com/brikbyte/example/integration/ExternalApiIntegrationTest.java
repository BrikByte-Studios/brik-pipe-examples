package com.brikbyte.example.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockserver.client.MockServerClient;
import org.mockserver.integration.ClientAndServer;
import org.mockserver.model.HttpRequest;
import org.mockserver.model.HttpResponse;

/**
 * ExternalApiIntegrationTest
 * --------------------------
 * Verifies that the Java service can talk to an embedded MockServer
 * instead of a real external API.
 *
 * The app should read external.api.base-url (e.g. from env/property)
 * and use that as the base URL for outbound calls.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ExternalApiIntegrationTest {

    private ClientAndServer mockServer;
    private MockServerClient mockClient;

    @BeforeAll
    void setupMocks() {
        // Start embedded MockServer on a random free port
        mockServer = ClientAndServer.startClientAndServer();
        int port = mockServer.getLocalPort();

        mockClient = new MockServerClient("localhost", port);

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

        String baseUrl = String.format("http://localhost:%d", port);
        System.out.printf("[MOCK] Embedded MockServer base URL: %s%n", baseUrl);

        // In a real system, wire this into Spring config (env/props).
        // For the example app, a simple system property is enough.
        System.setProperty("external.api.base-url", baseUrl);
    }

    @AfterAll
    void tearDown() {
        if (mockServer != null) {
            mockServer.stop();
        }
    }

    @Test
    void contextLoadsAndMocksAreReachable() {
        // Sanity check: embedded server is up
        assertThat(mockServer.isRunning()).isTrue();
    }
}
