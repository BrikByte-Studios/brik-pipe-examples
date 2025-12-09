//go:build smoke
// +build smoke

package smoke

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"testing"
	"time"
)

func appBaseURL() string {
	if v := os.Getenv("APP_BASE_URL"); v != "" {
		return v
	}
	// Fallback for local runs
	return "http://localhost:8080"
}

func newHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 5 * time.Second,
	}
}

// TestHealthEndpointSmoke
// ------------------------
// Smoke-level check that the /health endpoint responds with 2xx.
// We *do not* assume JSON here, only that the service is alive
func TestHealthEndpointSmoke(t *testing.T) {
	t.Helper()

	baseURL := appBaseURL()
	url := baseURL + "/health"

	t.Logf("[SMOKE] Hitting health endpoint: %s", url)

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, url, nil)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}

	resp, err := newHTTPClient().Do(req)
	if err != nil {
		t.Fatalf("health request failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		t.Fatalf("expected 2xx status, got %d. Body: %s", resp.StatusCode, string(body))
	}

	t.Logf("[SMOKE] /health OK. Status=%d Body=%q", resp.StatusCode, string(body))
}

// TestPaymentsEndpointSmoke
// -------------------------
// Smoke-level check that POST /payments returns 2xx and a JSON body
// with status == "approved". Adjust path/payload/contract to match
// your actual API.
func TestPaymentsEndpointSmoke(t *testing.T) {
	t.Helper()

	baseURL := appBaseURL()
	url := baseURL + "/payments"

	payload := map[string]any{
		"amount":   100.0,
		"currency": "ZAR",
		"source":   "smoke-test",
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal payload: %v", err)
	}

	t.Logf("[SMOKE] POST %s payload=%s", url, string(bodyBytes))

	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodPost,
		url,
		bytes.NewReader(bodyBytes),
	)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := newHTTPClient().Do(req)
	if err != nil {
		t.Fatalf("payments request failed: %v", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		t.Fatalf("expected 2xx status, got %d. Body: %s", resp.StatusCode, string(respBody))
	}

	var parsed map[string]any
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		t.Fatalf("failed to parse JSON response: %v. Raw body: %s", err, string(respBody))
	}

	status, _ := parsed["status"].(string)
	if status != "approved" {
		t.Fatalf("expected status='approved', got %q. Full body: %v", status, parsed)
	}

	t.Logf("[SMOKE] /payments OK. Status=%d Body=%s", resp.StatusCode, string(respBody))
}
