// health_handler.go
//
// Contains the /health HTTP handler used by the API.
//
// This is intentionally simple and uses only the Go standard library
// to keep the example lightweight and easy to run in CI.

package main

import (
	"encoding/json"
	"net/http"
)

// HealthResponse represents the JSON payload returned by the /health endpoint.
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

// HealthHandler responds with a static health payload.
//
// GET /health → 200 OK
// {
//   "status": "ok",
//   "service": "go-api-example",
//   "version": "1.0.0"
// }
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		// We only support GET for this example.
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	resp := HealthResponse{
		Status:  "ok",
		Service: "go-api-example",
		Version: "1.0.0",
	}

	w.Header().Set("Content-Type", "application/json")

	enc := json.NewEncoder(w)
	if err := enc.Encode(resp); err != nil {
		// If encoding fails, respond with a 500 error.
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
}
