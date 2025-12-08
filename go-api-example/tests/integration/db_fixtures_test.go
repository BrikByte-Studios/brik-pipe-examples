//go:build integration
// +build integration

// -----------------------------------------------------------------------------
// Sanity check that DB fixtures were applied (PIPE-INTEG-FIXTURES-CONFIG-002).
// Assumes fixtures created a "payments" table with at least one row.
// -----------------------------------------------------------------------------

package integration

import (
	"database/sql"
	"fmt"
	"os"
	"testing"

	_ "github.com/lib/pq"
)

func TestDBFixturesArePresent(t *testing.T) {
	dbHost := getenv("DB_HOST", "db")
	dbPort := getenv("DB_PORT", "5432")
	dbUser := getenv("DB_USER", "testuser")
	dbPassword := getenv("DB_PASSWORD", "testpass")
	dbName := getenv("DB_NAME", "testdb")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatalf("failed to open DB: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		t.Fatalf("failed to ping DB: %v", err)
	}

	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM payments").Scan(&count); err != nil {
		t.Fatalf("failed to query payments table: %v", err)
	}

	if count == 0 {
		t.Fatalf("expected at least 1 seeded payment row, got %d", count)
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
