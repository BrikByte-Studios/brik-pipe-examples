// main.go
//
// Entry point for the go-api-example service.
// This file wires up the HTTP server and delegates request
// handling to functions in health_handler.go.

package main

import (
	"log"
	"net/http"
)

func main() {
	// Register HTTP routes.
	http.HandleFunc("/health", HealthHandler)

	// Start the HTTP server on port 8080.
	// In CI, we typically don't run this binary as a long-running process;
	// instead, we build & test. But this allows local testing:
	//
	//   go run main.go
	//
	addr := ":8080"
	log.Printf("go-api-example listening on %s", addr)

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
