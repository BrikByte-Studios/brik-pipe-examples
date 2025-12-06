// Root endpoint for the go-api-example service.
// Mirrors other stack examples for BrikByteOS CI parity.

package main

import (
	"encoding/json"
	"net/http"
)

type rootResponse struct {
	Message string `json:"message"`
}

// RootHandler handles GET / and returns a simple JSON payload.
func RootHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	_ = json.NewEncoder(w).Encode(rootResponse{
		Message: "Go API Example — BrikByteOS pipelines OK",
	})
}
