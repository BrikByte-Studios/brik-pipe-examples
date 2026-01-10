-- Idempotent seed example
CREATE TABLE IF NOT EXISTS healthcheck_seed (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO healthcheck_seed DEFAULT VALUES;
