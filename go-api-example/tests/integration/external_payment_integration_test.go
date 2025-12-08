//go:build integration
// +build integration

package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
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
	// 1) Start mock external provider (in this test process).
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/external/payment" {
			http.NotFound(w, r)
			return
		}

		resp := paymentResponse{
			Status:        "approved",
			TransactionID: "mock-tx-123",
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer mockServer.Close()

	// 2) Point the service to the mock base URL.
	// NOTE: this only works if the code under test and this
	// test share a process, or you design the app to accept the
	// URL via config that can be overridden under test.
	os.Setenv("EXTERNAL_API_BASE_URL", mockServer.URL)

	// 3) Call the app under test over HTTP.
	appBaseURL := getenv("APP_BASE_URL", "http://app:8080")

	reqBody := paymentRequest{Amount: 100, Currency: "ZAR"}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		t.Fatalf("failed to marshal request body: %v", err)
	}

	resp, err := http.Post(appBaseURL+"/payments", "application/json", bytes.NewReader(bodyBytes)) //nolint:noctx
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

	if got.Status != "approved" || got.TransactionID != "mock-tx-123" {
		t.Fatalf("unexpected payment response: %+v", got)
	}
}
