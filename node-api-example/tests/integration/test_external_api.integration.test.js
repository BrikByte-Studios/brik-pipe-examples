// File: tests/integration/test_external_api.integration.test.js

/**
 * Integration test verifying that our service calls a mocked external API
 * instead of the real provider.
 */

import test, { describe, it, before, after } from "node:test";
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

  // Point the service to the mock base URL (if it reads this at runtime)
  // NOTE: This only affects *this process*; if your app reads EXTERNAL_API_BASE_URL
  // at startup, you should also set this in the app container env in your workflow.
  process.env.EXTERNAL_API_BASE_URL = `http://host.docker.internal:${MOCK_PORT}`;
});

after(async () => {
  // Stop mock external API server
  await stopMockServer();
});

describe("Integration: external payment flow (mocked)", () => {
  it("creates payment using mocked provider", async () => {
    const response = await fetch(`${APP_BASE_URL}/payments`, {
      amount: 100,
      currency: "ZAR",
    });
    // Assume service exposes /payments that calls EXTERNAL_API_BASE_URL
    const data = await response.json();

    assert.equal(data.status, 200);
    assert.deepEqual(data.data, {
      status: "approved",
      transactionId: "mock-tx-123",
    });
  });
});
