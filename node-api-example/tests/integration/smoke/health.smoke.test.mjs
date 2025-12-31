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

test('health endpoint responds successfully (smoke)', async () => {
  const url = `${APP_BASE_URL}/health`;
  const res = await fetch(url);

  // 1) Basic HTTP sanity check
  assert.ok(
    res.ok,
    `Expected /health to return 2xx, got ${res.status} from ${url}`
  );

  // 2) Be flexible with the body format: JSON or plain text
  const contentType = res.headers.get('content-type') ?? '';
  const raw = await res.text();

  if (contentType.includes('application/json')) {
    // JSON health response
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error(
        `Health endpoint advertises JSON but body is not valid JSON. Raw body: ${raw}`
      );
    }

    // Light-touch assertion for JSON case
    if ('status' in body) {
      assert.equal(
        body.status,
        'ok',
        `Expected JSON health.status = "ok", got ${JSON.stringify(body)}`
      );
    }
  } else {
    // Plain-text health response, e.g. "OK"
    const normalized = raw.trim().toLowerCase();
    assert.ok(
      normalized === 'ok' || normalized.includes('ok'),
      `Expected plain-text health body to contain "ok", got: ${raw}`
    );
  }
});
