/**
 * Integration test verifying that our service calls a mocked external API
 * instead of the real provider.
 */

import axios from "axios";

import {
  startMockServer,
  stopMockServer,
  MOCK_PORT
} from "./mocks/mock-external-api.js";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

describe("Integration: external payment flow (mocked)", () => {
  beforeAll(async () => {
    await startMockServer();
    // Point the service to the mock base URL (e.g. it reads ENV)
    process.env.EXTERNAL_API_BASE_URL = `http://host.docker.internal:${MOCK_PORT}`;
  });

  afterAll(async () => {
    await stopMockServer();
  });

  it("creates payment using mocked provider", async () => {
    // Assume service has /payments route that calls EXTERNAL_API_BASE_URL.
    const res = await axios.post(`${APP_BASE_URL}/payments`, {
      amount: 100,
      currency: "ZAR",
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("providerStatus", "approved");
    expect(res.data).toHaveProperty("transactionId", "mock-tx-123");
  });
});
