-- 00_schema.sql
-- Basic schema for integration tests. Idempotent via IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
