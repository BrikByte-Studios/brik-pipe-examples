package com.brikbyte.example.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Root + Health + Payments endpoints
 * ----------------------------------
 * Brings the Java example in line with cross-stack BrikPipe contracts:
 *
 *   - GET /        → { "message": "Java API Example — BrikByteOS pipelines OK" }
 *   - GET /health  → { "status": "ok", "service": "java-api-example" }
 *   - POST /payments
 *       Request : { "amount": 100, "currency": "ZAR" }
 *       Response: { "status": "approved", "transactionId": "mock-tx-123" }
 *
 * These JSON shapes are what the smoke integration tests expect.
 */
@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class RootAndPaymentsController {

    // ----------------------------------------------------------
    // ROOT ENDPOINT  → used for cross-stack parity validation
    // ----------------------------------------------------------
    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Java API Example — BrikByteOS pipelines OK");
        return body;
    }

    // ----------------------------------------------------------
    // HEALTH ENDPOINT  → required for BrikPipe readiness checks
    // ----------------------------------------------------------
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "ok");
        body.put("service", "java-api-example");
        return body;
    }

    // ----------------------------------------------------------
    // PAYMENTS ENDPOINT  → smoke + external-provider integration
    // ----------------------------------------------------------

    /**
     * Minimal request payload used by the smoke tests.
     * Matches the Node/.NET examples:
     *
     *   {
     *     "amount": 100,
     *     "currency": "ZAR"
     *   }
     */
    public record PaymentRequest(int amount, String currency) { }

    /**
     * Minimal response contract expected by:
     *   - Java smoke tests (PaymentsEndpointSmokeIT)
     *   - Cross-stack integration examples.
     *
     *   {
     *     "status": "approved",
     *     "transactionId": "mock-tx-123"
     *   }
     */
    public record PaymentResponse(String status, String transactionId) { }

    @PostMapping(path = "/payments", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody PaymentRequest request) {
        // For the PoC + smoke tests, we don't call a real external provider yet.
        // We just return a deterministic stubbed response that matches
        // the BrikPipe example expectations.
        PaymentResponse response = new PaymentResponse("approved", "mock-tx-123");
        return ResponseEntity.ok(response);
    }
}
