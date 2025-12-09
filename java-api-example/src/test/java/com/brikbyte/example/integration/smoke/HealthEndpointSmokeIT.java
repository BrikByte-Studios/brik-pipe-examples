package com.brikbyte.example.integration.smoke;

import com.brikbyte.example.JavaApiExampleApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SMOKE IT: Minimal verification that the service is up and reporting healthy.
 *
 * Runs as a Spring Boot integration test using a random port, so it:
 *   - Boots the full application context.
 *   - Issues a real HTTP GET to /health.
 *
 * Naming convention:
 *   - Ends with "IT" so Maven Failsafe picks it up as an integration test:
 *       **/*IT.java
 */
@SpringBootTest(
        classes = JavaApiExampleApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
class HealthEndpointSmokeIT {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("SMOKE: /health responds with status=ok")
    void healthEndpointShouldReturnOkStatus() {
        String url = "http://localhost:" + port + "/health";

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        // Basic status code check
        assertThat(response.getStatusCode().is2xxSuccessful())
                .as("HTTP status should be 2xx")
                .isTrue();

        // JSON payload shape: { "status": "ok", ... }
        Map<String, Object> body = response.getBody();
        assertThat(body)
                .as("Response body should not be null")
                .isNotNull();

        assertThat(body.get("status"))
                .as("status field should be 'ok'")
                .isEqualTo("ok");
    }
}
