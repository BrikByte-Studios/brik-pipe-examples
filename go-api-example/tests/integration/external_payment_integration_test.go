//go:build integration
// +build integration

package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"
	"time"
)

type paymentRequest struct {
	Amount   int    `json:"amount"`
	Currency string `json:"currency"`
}

type paymentResponse struct {
	Status        string `json:"status"`
	TransactionID string `json:"transactionId"`
}

func TestExternalPaymentFlowUsesMock(t *testing.T) {
	// In Compose-lab, this should be something like http://app:8080
	appBaseURL := env("http://localhost:8080", "APP_BASE_URL")

	// IMPORTANT:
	// This must be set INSIDE the app container by docker-compose.
	// The test process cannot change env vars for a running container.
	externalBase := env("", "EXTERNAL_API_BASE_URL")
	if externalBase == "" {
		t.Skip("EXTERNAL_API_BASE_URL not set — external mock not wired in compose")
	}

	client := &http.Client{Timeout: 5 * time.Second}

	reqBody := paymentRequest{Amount: 100, Currency: "ZAR"}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		t.Fatalf("failed to marshal request body: %v", err)
	}

	req, err := http.NewRequest(http.MethodPost, appBaseURL+"/payments", bytes.NewReader(bodyBytes))
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("failed to call /payments: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK from /payments, got %d", resp.StatusCode)
	}

	var got paymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&got); err != nil {
		t.Fatalf("failed to decode /payments response: %v", err)
	}

	if got.Status != "approved" {
		t.Fatalf("expected status=approved, got %q", got.Status)
	}
	if got.TransactionID == "" {
		t.Fatalf("expected non-empty transactionId, got empty")
	}
}
