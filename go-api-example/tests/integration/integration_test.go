//go:build integration
// +build integration

// integration_test.go
//
// Containerized integration tests for go-api-example,
// driven by the BrikPipe integration test runner.
//
// These tests hit the *running container* over HTTP, using APP_BASE_URL
// (e.g., http://app:8080 in CI) as configured by the pipeline.

package integration

import (
	"encoding/json"
	"net/http"
	"os"
	"testing"
	"time"
)

// Local test DTOs to avoid clashing with production structs.
//
// GET /
//
//	{
//	  "message": "Go API Example — BrikByteOS pipelines OK"
//	}
type rootPayload struct {
	Message string `json:"message"`
}

// GET /health
//
//	{
//	  "status":  "ok",
//	  "service": "go-api-example",
//	  "version": "1.0.0"
//	}
type healthPayload struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

// baseURL reads APP_BASE_URL (e.g. http://app:8080 in CI) or falls back to localhost.
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

// NOTE: name contains "Integration" → matched by `-run Integration`.
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

	var body rootPayload
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

	var body healthPayload
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode JSON: %v", err)
	}

	if body.Status != "ok" {
		t.Fatalf("unexpected status: got %q, want %q", body.Status, "ok")
	}
	if body.Service != "go-api-example" {
		t.Fatalf("unexpected service: got %q, want %q", body.Service, "go-api-example")
	}
	if body.Version != "1.0.0" {
		t.Fatalf("unexpected version: got %q, want %q", body.Version, "1.0.0")
	}
}
