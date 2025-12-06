-- 10_base_seed.sql
-- Base seed data for integration tests. SAFE to run multiple times
-- thanks to ON CONFLICT clauses.

INSERT INTO users (id, email, name)
VALUES
    (1, 'integration.user@example.com', 'Integration User')
ON CONFLICT (id) DO NOTHING;
