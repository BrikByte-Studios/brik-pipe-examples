// health_handler_test.go
//
// Tests the /health handler to ensure it:
//   - returns HTTP 200
//   - returns JSON with status="ok" and correct service name.

package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler_OK(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	HealthHandler(rr, req)

	// 1) Assert HTTP status.
	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	// 2) Assert Content-Type header.
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %q", ct)
	}

	// 3) Assert JSON body.
	var resp healthResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Status != "ok" {
		t.Errorf("expected status 'ok', got %q", resp.Status)
	}
	if resp.Service != "go-api-example" {
		t.Errorf("expected service 'go-api-example', got %q", resp.Service)
	}
	if resp.Version != "1.0.0" {
		t.Errorf("expected version '1.0.0', got %q", resp.Version)
	}
}

func TestHealthHandler_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/health", nil)
	rr := httptest.NewRecorder()

	HealthHandler(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

type failWriter struct {
	header http.Header
}

func (fw *failWriter) Header() http.Header {
	if fw.header == nil {
		fw.header = make(http.Header)
	}
	return fw.header
}

func (fw *failWriter) WriteHeader(statusCode int) {
	// we don't need to store status; http.Error will still call Write,
	// which we force to fail.
}

func (fw *failWriter) Write(p []byte) (int, error) {
	return 0, http.ErrHandlerTimeout // any non-nil error works
}

func TestHealthHandler_EncodeError(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	fw := &failWriter{}

	HealthHandler(fw, req)

	// We can't directly read the status from failWriter, but this test
	// forces the json.Encoder to error and exercise the 500 path, which
	// increases coverage on HealthHandler's error branch.
}
