package com.brikbyte.example.integration.smoke;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import com.brikbyte.example.JavaApiExampleApplication;

/**
 * SMOKE IT: Minimal check that POST /payments works end-to-end.
 *
 * Intent:
 *   - Do NOT exhaustively test domain rules here.
 *   - Only verify:
 *       * Endpoint is reachable.
 *       * A simple payload is accepted.
 *       * Response indicates an approved transaction.
 */
@SpringBootTest(
        classes = JavaApiExampleApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
class PaymentsEndpointSmokeIT {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("SMOKE: POST /payments returns approved transaction")
    void paymentsEndpointShouldReturnApprovedTransaction() {
        String url = "http://localhost:" + port + "/payments";

        // Minimal request payload – adjust keys if your controller expects different ones.
        Map<String, Object> payload = new HashMap<>();
        payload.put("amount", 100);
        payload.put("currency", "ZAR");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

        // Basic status code check
        assertThat(response.getStatusCode().is2xxSuccessful())
                .as("HTTP status should be 2xx")
                .isTrue();

        Map<String, Object> body = response.getBody();
        assertThat(body)
                .as("Response body should not be null")
                .isNotNull();

        // Expected minimal contract: { "status": "approved", "transactionId": "<string>" }
        assertThat(body.get("status"))
                .as("status field should be 'approved'")
                .isEqualTo("approved");

        assertThat(body.get("transactionId"))
                .as("transactionId should be a non-empty string")
                .isInstanceOf(String.class);

        String transactionId = (String) body.get("transactionId");
        assertThat(transactionId)
                .as("transactionId should not be blank")
                .isNotBlank();
    }
}
