// BrikPipe — Node API Smoke Test (Payments Happy Path)
//
// Purpose (CI-friendly):
//   - Exercise ONE golden-path call to /payments end-to-end:
//       app container → DB (if used) → any internal logic.
//   - Keep it very fast and deterministic.
//   - No external network calls; any “external provider” should be mocked
//     via config/env inside the app.
//
// Assumptions for the example service:
//   - POST /payments
//   - Request body: { amount: number, currency: string }
//   - Response: 2xx JSON with { status: "approved", transactionId: string }
//
// If your actual contract differs, tweak the assertions accordingly.
//

import test from 'node:test';
import assert from 'node:assert/strict';

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

test('POST /payments returns approved transaction (smoke)', async () => {
  const url = `${APP_BASE_URL}/payments`;

  const payload = {
    amount: 100,
    currency: 'ZAR',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Smoke test: just demand a successful status code.
  assert.ok(
    res.ok,
    `Expected /payments to return 2xx, got ${res.status} from ${url}`
  );

  const body = await res.json();

  // Light-touch assertions: enough to catch broken wiring, not full schema.
  assert.equal(
    body.status,
    'approved',
    `Expected status="approved", got ${JSON.stringify(body)}`
  );

  assert.ok(
    typeof body.transactionId === 'string' && body.transactionId.length > 0,
    `Expected non-empty transactionId, got ${JSON.stringify(body)}`
  );
});
