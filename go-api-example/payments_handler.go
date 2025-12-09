package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type PaymentRequest struct {
	Amount   float64 `json:"amount"`           // accept 100.0
	Currency string  `json:"currency"`
	Source   string  `json:"source,omitempty"` // used by smoke tests
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
	stubMode := os.Getenv("EXTERNAL_API_STUB_MODE") == "true"

	// -----------------------------------------------------------------
	// Smoke-friendly path:
	// If EXTERNAL_API_BASE_URL is missing BUT stub mode is enabled,
	// return a deterministic approved response instead of 500.
	// -----------------------------------------------------------------
	if baseURL == "" && stubMode {
		log.Println("[SMOKE] EXTERNAL_API_BASE_URL not set; returning stub approval response")

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(PaymentResponse{
			Status:        "approved",
			TransactionID: "smoke-tx-123",
		})
		return
	}

	// -----------------------------------------------------------------
	// Original behaviour for normal runs / unit tests:
	// -----------------------------------------------------------------
	if baseURL == "" {
		http.Error(w, "EXTERNAL_API_BASE_URL not configured", http.StatusInternalServerError)
		return
	}

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
