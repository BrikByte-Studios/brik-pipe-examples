/**
 * Integration test verifying that our service calls a mocked external API
 * instead of the real provider.
 *
 * This test validates the full flow:
 * App → Mocked External Provider → App → Client
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

import {
  startMockServer,
  stopMockServer,
  MOCK_PORT,
} from "./mocks/mock-external-api.js";

// Base URL for the app under test
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

// 🔧 Global integration hooks for this file
before(async () => {
  // Start mock external API server
  await startMockServer();

  // Point the service to the mock base URL (runtime override for this process)
  // NOTE:
  // If your app reads EXTERNAL_API_BASE_URL only at container startup,
  // this must also be set in the CI workflow environment.
  process.env.EXTERNAL_API_BASE_URL = `http://host.docker.internal:${MOCK_PORT}`;
});

after(async () => {
  // Stop mock external API server
  await stopMockServer();
});

describe("Integration: external payment flow (mocked)", () => {
  it("creates payment using mocked provider", async () => {
    // Act: call the service endpoint that triggers an external API call
    const response = await fetch(`${APP_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
        currency: "ZAR",
      }),
    });

    // Transport-level assertion (HTTP)
    assert.equal(response.status, 200, "HTTP status should be 200");

    const data = await response.json();

    // Business-level assertion (mocked provider response)
    assert.deepEqual(data, {
      status: "approved",
      transactionId: "mock-tx-123",
    });
  });
});