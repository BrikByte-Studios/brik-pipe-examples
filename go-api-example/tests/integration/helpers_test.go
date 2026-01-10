//go:build integration
// +build integration

package integration

import "os"

// env returns the first non-empty environment variable from keys,
// otherwise returns def.
func env(def string, keys ...string) string {
	for _, k := range keys {
		if v := os.Getenv(k); v != "" {
			return v
		}
	}
	return def
}
