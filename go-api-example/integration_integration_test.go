// +build integration

package main

import (
	"encoding/json"
	"net/http"
	"os"
	"testing"
	"time"
)

type rootResponse struct {
	Message string `json:"message"`
}

type healthResponse struct {
	Status string `json:"status"`
}

// helper: get base URL from env (APP_BASE_URL) or default to http://localhost:8080
func getBaseURL(t *testing.T) string {
	t.Helper()

	if base := os.Getenv("APP_BASE_URL"); base != "" {
		return base
	}
	// Fallback — useful for local `go test` runs outside CI
	return "http://localhost:8080"
}

// helper: small HTTP client with timeout
func newHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 5 * time.Second,
	}
}

// TestIntegration_RootEndpoint checks that GET / responds 200 and has the expected message.
func TestIntegration_RootEndpoint(t *testing.T) {
	baseURL := getBaseURL(t)
	client := newHTTPClient()

	resp, err := client.Get(baseURL + "/")
	if err != nil {
		t.Fatalf("failed to call GET %s/: %v", baseURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", resp.StatusCode)
	}

	var body rootResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode JSON response: %v", err)
	}

	want := "Go API Example — BrikByteOS pipelines OK"
	if body.Message != want {
		t.Fatalf("unexpected message. got %q, want %q", body.Message, want)
	}
}

// TestIntegration_HealthEndpoint checks that GET /health responds 200 and { "status": "ok" }.
func TestIntegration_HealthEndpoint(t *testing.T) {
	baseURL := getBaseURL(t)
	client := newHTTPClient()

	resp, err := client.Get(baseURL + "/health")
	if err != nil {
		t.Fatalf("failed to call GET %s/health: %v", baseURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", resp.StatusCode)
	}

	var body healthResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode JSON response: %v", err)
	}

	if body.Status != "ok" {
		t.Fatalf("unexpected status. got %q, want %q", body.Status, "ok")
	}
}
