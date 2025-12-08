// -----------------------------------------------------------------------------
// Verifies that the Go service calls the mocked external provider via
// EXTERNAL_API_BASE_URL instead of a real external API.
// -----------------------------------------------------------------------------

package integration

import (
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
	// 1) Start mock external provider
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/external/payment" {
			http.NotFound(w, r)
			return
		}

		// For simplicity we skip reading the request body here.
		resp := paymentResponse{
			Status:        "approved",
			TransactionID: "mock-tx-123",
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer mockServer.Close()

	// 2) Point the service to the mock base URL
	// In Docker, you'd set this to host.docker.internal:<port> from env,
	// but within this pure Go test we just use the mockServer.URL.
	os.Setenv("EXTERNAL_API_BASE_URL", mockServer.URL) //nolint:errcheck

	// 3) Call the app under test. In the real BrikPipe integ runner,
	//    APP_BASE_URL is injected via environment (e.g. http://app:8080).
	appBaseURL := getenv("APP_BASE_URL", "http://app:8080")

	reqBody := paymentRequest{Amount: 100, Currency: "ZAR"}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		t.Fatalf("failed to marshal request body: %v", err)
	}

	resp, err := http.Post(appBaseURL+"/payments", "application/json", //nolint:noctx
	                       bytes.NewReader(bodyBytes))
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
