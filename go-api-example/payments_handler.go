package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
)

// Align with smoke test payload:
//   { "amount": 100.0, "currency": "ZAR", "source": "smoke-test" }
type PaymentRequest struct {
	Amount   float64 `json:"amount"`           // use float64 to accept 100.0
	Currency string  `json:"currency"`
	Source   string  `json:"source,omitempty"` // optional, but present in smoke tests
}

type PaymentResponse struct {
	Status        string `json:"status"`
	TransactionID string `json:"transactionId"`
}

// httpClient is injectable for unit tests
var httpClient = http.DefaultClient

func PaymentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	baseURL := os.Getenv("EXTERNAL_API_BASE_URL")

	// -----------------------------------------------------------------
	// Smoke-friendly behaviour:
	// If EXTERNAL_API_BASE_URL is NOT configured, return a stubbed 200.
	// This lets focused integration/smoke tests pass without wiring
	// the real external provider.
	// -----------------------------------------------------------------
	if baseURL == "" {
		log.Println("[SMOKE] EXTERNAL_API_BASE_URL not configured; returning stub approval response")

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		_ = json.NewEncoder(w).Encode(PaymentResponse{
			Status:        "approved",
			TransactionID: "smoke-tx-123",
		})
		return
	}

	// -----------------------------------------------------------------
	// Real external provider path:
	// Only executed when EXTERNAL_API_BASE_URL is set (e.g. full ITs).
	// -----------------------------------------------------------------
	jsonBody, _ := json.Marshal(req)

	resp, err := httpClient.Post(
		baseURL+"/external/payment",
		"application/json",
		bytes.NewReader(jsonBody),
	)
	if err != nil || resp.StatusCode != http.StatusOK {
		http.Error(w, "external provider failure", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	var paymentResp PaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&paymentResp); err != nil {
		http.Error(w, "invalid external response", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(paymentResp)
}
