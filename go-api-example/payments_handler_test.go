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

// stubRoundTripper allows us to fake outbound HTTP calls
type stubRoundTripper struct {
	fn func(req *http.Request) (*http.Response, error)
}

func (s *stubRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return s.fn(req)
}

func stubHTTPClient(fn func(req *http.Request) (*http.Response, error)) {
	httpClient = &http.Client{
		Transport: &stubRoundTripper{fn: fn},
	}
}

func resetHTTPClient() {
	httpClient = http.DefaultClient
}

func TestPayments_OK_WithMockedExternalAPI(t *testing.T) {
	defer resetHTTPClient()
	os.Setenv("EXTERNAL_API_BASE_URL", "http://mock-api")
	defer os.Unsetenv("EXTERNAL_API_BASE_URL")

	// ✅ Mock external provider response
	stubHTTPClient(func(req *http.Request) (*http.Response, error) {
		body := io.NopCloser(bytes.NewBufferString(`
			{"status":"approved","transactionId":"mock-tx-123"}
		`))

		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       body,
			Header:     make(http.Header),
		}, nil
	})

	reqBody := `{"amount":100,"currency":"ZAR"}`
	req := httptest.NewRequest(http.MethodPost, "/payments", bytes.NewBufferString(reqBody))
	rec := httptest.NewRecorder()

	PaymentsHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var resp PaymentResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}

	if resp.Status != "approved" {
		t.Fatalf("unexpected status: %s", resp.Status)
	}
}

func TestPayments_Fails_WithoutExternalBaseURL(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/payments", bytes.NewBufferString(`{}`))
	rec := httptest.NewRecorder()

	PaymentsHandler(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
}

func TestPayments_Rejects_InvalidJSON(t *testing.T) {
	os.Setenv("EXTERNAL_API_BASE_URL", "http://mock")
	defer os.Unsetenv("EXTERNAL_API_BASE_URL")

	req := httptest.NewRequest(http.MethodPost, "/payments", bytes.NewBufferString(`invalid`))
	rec := httptest.NewRecorder()

	PaymentsHandler(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestPayments_Rejects_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/payments", nil)
	rec := httptest.NewRecorder()

	PaymentsHandler(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rec.Code)
	}
}
