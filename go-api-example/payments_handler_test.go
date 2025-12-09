package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// Helper to reset global state between tests
func resetEnvAndClient(t *testing.T, originalClient *http.Client, originalBaseURL string) {
	t.Helper()

	httpClient = originalClient

	if originalBaseURL == "" {
		_ = os.Unsetenv("EXTERNAL_API_BASE_URL")
	} else {
		_ = os.Setenv("EXTERNAL_API_BASE_URL", originalBaseURL)
	}
}

// --- Test: method not allowed (non-POST) ------------------------------------

func TestPaymentsHandler_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/payments", nil)
	rr := httptest.NewRecorder()

	PaymentsHandler(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

// --- Test: invalid JSON body -----------------------------------------------

func TestPaymentsHandler_InvalidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/payments", bytes.NewBufferString("not-json"))
	rr := httptest.NewRecorder()

	PaymentsHandler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
	if body := rr.Body.String(); body == "" {
		t.Fatalf("expected an error body, got empty string")
	}
}

// --- Test: missing EXTERNAL_API_BASE_URL ------------------------------------

func TestPaymentsHandler_MissingBaseURL(t *testing.T) {
	// Save and restore state
	origClient := httpClient
	origBaseURL := os.Getenv("EXTERNAL_API_BASE_URL")
	defer resetEnvAndClient(t, origClient, origBaseURL)

	_ = os.Unsetenv("EXTERNAL_API_BASE_URL")

	payload := PaymentRequest{Amount: 100, Currency: "ZAR"}
	body, _ := json.Marshal(&payload)

	req := httptest.NewRequest(http.MethodPost, "/payments", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()

	PaymentsHandler(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, rr.Code)
	}
	if got := rr.Body.String(); got == "" {
		t.Fatalf("expected error message body, got empty")
	}
}

// --- Test: external provider returns non-200 --------------------------------

type failingRoundTripper struct{}

func (f *failingRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	// Simulate provider returning 500
	return &http.Response{
		StatusCode: http.StatusInternalServerError,
		Body:       io.NopCloser(bytes.NewBufferString("boom")),
		Header:     make(http.Header),
	}, nil
}

func TestPaymentsHandler_ExternalFailure(t *testing.T) {
	origClient := httpClient
	origBaseURL := os.Getenv("EXTERNAL_API_BASE_URL")
	defer resetEnvAndClient(t, origClient, origBaseURL)

	_ = os.Setenv("EXTERNAL_API_BASE_URL", "http://fake-provider")

	// Inject a client that always returns 500
	httpClient = &http.Client{
		Transport: &failingRoundTripper{},
	}

	payload := PaymentRequest{Amount: 100, Currency: "ZAR"}
	body, _ := json.Marshal(&payload)

	req := httptest.NewRequest(http.MethodPost, "/payments", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	PaymentsHandler(rr, req)

	if rr.Code != http.StatusBadGateway {
		t.Fatalf("expected status %d, got %d", http.StatusBadGateway, rr.Code)
	}
}

// --- Test: happy-path external provider success -----------------------------

type successRoundTripper struct{}

func (s *successRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	respBody := `{"status":"approved","transactionId":"unit-test-tx-123"}`
	return &http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(bytes.NewBufferString(respBody)),
		Header:     make(http.Header),
	}, nil
}

func TestPaymentsHandler_Success(t *testing.T) {
	origClient := httpClient
	origBaseURL := os.Getenv("EXTERNAL_API_BASE_URL")
	defer resetEnvAndClient(t, origClient, origBaseURL)

	_ = os.Setenv("EXTERNAL_API_BASE_URL", "http://fake-provider")

	httpClient = &http.Client{
		Transport: &successRoundTripper{},
	}

	payload := PaymentRequest{Amount: 100, Currency: "ZAR"}
	body, _ := json.Marshal(&payload)

	req := httptest.NewRequest(http.MethodPost, "/payments", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	PaymentsHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var parsed PaymentResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &parsed); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if parsed.Status != "approved" {
		t.Fatalf("expected status 'approved', got %q", parsed.Status)
	}
	if parsed.TransactionID == "" {
		t.Fatalf("expected non-empty transaction ID")
	}
}
