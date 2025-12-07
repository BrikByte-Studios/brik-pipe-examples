/**
 * Integration test verifying that our service calls a mocked external API
 * instead of the real provider.
 */

import axios from "axios";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  startMockServer,
  stopMockServer,
  MOCK_PORT,
} from "./mocks/mock-external-api.js";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

describe("Integration: external payment flow (mocked)", async (t) => {
  // Proper lifecycle hooks in Node 20
  await startMockServer();

  // Point the service to the mock base URL
  process.env.EXTERNAL_API_BASE_URL = `http://host.docker.internal:${MOCK_PORT}`;

  t.after(async () => {
    await stopMockServer();
  });

  it("creates payment using mocked provider", async () => {
    const res = await axios.post(`${APP_BASE_URL}/payments`, {
      amount: 100,
      currency: "ZAR",
    });

    assert.equal(res.status, 200);
    assert.deepEqual(res.data, {
      status: "approved",
      transactionId: "mock-tx-123",
    });
  });
});
