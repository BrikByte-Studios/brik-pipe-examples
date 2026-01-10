CREATE TABLE IF NOT EXISTS payments (
  id         SERIAL PRIMARY KEY,
  amount     INTEGER     NOT NULL,
  currency   VARCHAR(8)  NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO payments (amount, currency) VALUES (100, 'ZAR');