//go:build integration
// +build integration

// -----------------------------------------------------------------------------
// PIPE-INTEG-FIXTURES-CONFIG-002
//
// Validates that database seed fixtures were successfully applied inside the
// BrikByteOS integration lab environment.
//
// Auto-adapts to:
//   • GitHub Actions runner-host execution   → TEST_DB_* + localhost
//   • Docker Compose network execution       → DB_* + db
//   • Local developer runs                   → fallback defaults
// -----------------------------------------------------------------------------

package integration

import (
	"database/sql"
	"fmt"
	"testing"

	_ "github.com/lib/pq"
)

func TestDBFixturesArePresent(t *testing.T) {
	dbHost := env("localhost", "TEST_DB_HOST", "DB_HOST")
	dbPort := env("5432", "TEST_DB_PORT", "DB_PORT")
	dbUser := env("testuser", "TEST_DB_USER", "DB_USER")
	dbPassword := env("testpass", "TEST_DB_PASSWORD", "DB_PASSWORD")
	dbName := env("testdb", "TEST_DB_NAME", "DB_NAME")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatalf("failed to open DB connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		t.Fatalf("failed to ping DB (%s:%s): %v", dbHost, dbPort, err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM payments`).Scan(&count); err != nil {
		t.Fatalf("failed to query seeded payments table: %v", err)
	}

	if count == 0 {
		t.Fatalf("expected seeded payments, but table is empty")
	}

	t.Logf("✅ DB fixtures present — %d seeded rows found", count)
}
