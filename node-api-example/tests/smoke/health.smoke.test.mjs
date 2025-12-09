// BrikPipe — Node API Smoke Test (Health Endpoint)
//
// Purpose (CI-friendly):
//   - Very fast signal that the containerized app is up and responding.
//   - No DB mutations, no heavy flows.
//   - Runs in < 1s when app is healthy.
//
// Conventions:
//   - APP_BASE_URL is injected by the BrikPipe integration-test runner
//     (e.g. http://app:3000 in CI).
//   - For local runs, we fall back to http://localhost:3000.
//

import test from 'node:test';
import assert from 'node:assert/strict';

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

test('health endpoint responds with status=ok (smoke)', async () => {
  const url = `${APP_BASE_URL}/health`;
  const res = await fetch(url);

  // Basic HTTP sanity: 2xx
  assert.ok(
    res.ok,
    `Expected /health to return 2xx, got ${res.status} from ${url}`
  );

  const body = await res.json();

  // We keep assertions minimal and tolerant (smoke, not contract test)
  assert.equal(
    body.status,
    'ok',
    `Expected health.status = "ok", got ${JSON.stringify(body)}`
  );
});
