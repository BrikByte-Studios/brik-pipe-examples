package main

import (
	"encoding/json"
	"net/http"
	"os"
	"testing"
	"time"
)

// baseURL reads APP_BASE_URL (in CI it's http://app:8080) or falls back to localhost.
func baseURL(t *testing.T) string {
	t.Helper()

	if v := os.Getenv("APP_BASE_URL"); v != "" {
		return v
	}
	return "http://localhost:8080"
}

func httpClient() *http.Client {
	return &http.Client{
		Timeout: 5 * time.Second,
	}
}

// NOTE: function name contains "Integration" → picked up by `-run Integration`.

func TestIntegration_RootEndpoint(t *testing.T) {
	client := httpClient()
	url := baseURL(t) + "/"

	resp, err := client.Get(url)
	if err != nil {
		t.Fatalf("GET %s failed: %v", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var body rootResponse // from production code
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode JSON: %v", err)
	}

	want := "Go API Example — BrikByteOS pipelines OK"
	if body.Message != want {
		t.Fatalf("unexpected message: got %q, want %q", body.Message, want)
	}
}

func TestIntegration_HealthEndpoint(t *testing.T) {
	client := httpClient()
	url := baseURL(t) + "/health"

	resp, err := client.Get(url)
	if err != nil {
		t.Fatalf("GET %s failed: %v", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var body healthResponse // from production code
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode JSON: %v", err)
	}

	if body.Status != "ok" {
		t.Fatalf("unexpected status: got %q, want %q", body.Status, "ok")
	}
}
