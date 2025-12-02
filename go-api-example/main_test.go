// main_test.go
//
// Tests that main() wires routes and calls listenAndServe correctly,
// without actually starting a real HTTP server.

package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMain_RegistersHealthRouteAndStartsServer(t *testing.T) {
	// Save and restore the original listenAndServe to avoid leaking state.
	origListenAndServe := listenAndServe
	defer func() {
		listenAndServe = origListenAndServe
	}()

	var called bool
	var gotAddr string
	var gotHandler http.Handler

	// Reset the default mux for a clean slate in this test.
	http.DefaultServeMux = http.NewServeMux()

	// Stub listenAndServe so we don't start a real server.
	listenAndServe = func(addr string, handler http.Handler) error {
		called = true
		gotAddr = addr

		// In real http.ListenAndServe, nil = use http.DefaultServeMux.
		if handler == nil {
			gotHandler = http.DefaultServeMux
		} else {
			gotHandler = handler
		}
		return nil // pretend server started fine
	}

	// Act: call main().
	main()

	// Assert listenAndServe was called as expected.
	if !called {
		t.Fatalf("expected listenAndServe to be called, but it was not")
	}
	if gotAddr != ":8080" {
		t.Fatalf("expected listenAndServe addr ':8080', got %q", gotAddr)
	}
	if gotHandler == nil {
		t.Fatalf("expected a non-nil handler passed to listenAndServe (or default mux)")
	}

	// Assert that /health is actually wired and returns the expected response.
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()

	gotHandler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected /health via mux to return 200, got %d", rr.Code)
	}
}
