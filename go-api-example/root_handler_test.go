//
// Unit tests for the Go API example.
// These are *not* integration tests – they call handlers directly and
// are run by `make test` / `go test ./...` in CI.

package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestRootHandler_OK exercises the happy path of the "/" endpoint.
func TestRootHandler_OK(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()

	RootHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var body struct {
		Message string `json:"message"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	want := "Go API Example — BrikByteOS pipelines OK"
	if body.Message != want {
		t.Fatalf("unexpected message: got %q, want %q", body.Message, want)
	}
}
