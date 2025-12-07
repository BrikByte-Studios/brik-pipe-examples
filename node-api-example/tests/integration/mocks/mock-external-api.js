/**
 * Simple Node-based mock HTTP server for external API calls.
 *
 * Usage (e.g. in Jest):
 *   const { startMockServer, stopMockServer, MOCK_PORT } = require('./mock-external-api');
 *
 *   beforeAll(async () => {
 *     await startMockServer();
 *     process.env.EXTERNAL_API_BASE_URL = `http://localhost:${MOCK_PORT}`;
 *   });
 *
 *   afterAll(async () => {
 *     await stopMockServer();
 *   });
 */

import http from "http";

export const MOCK_PORT = process.env.MOCK_PORT || 18080;

let server;

/**
 * Starts a lightweight HTTP mock server that returns JSON for a few routes.
 */
export function startMockServer() {
  return new Promise((resolve) => {
    if (server) {
      return resolve();
    }

    server = http.createServer((req, res) => {
      if (req.url === "/external/payment" && req.method === "POST") {
        // Example: fake payment provider response
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "approved",
            transactionId: "mock-tx-123",
          })
        );
        return;
      }

      // Default: 404 for unexpected routes
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    });

    server.listen(MOCK_PORT, () => {
      console.log(`[MOCK] External API mock listening on port ${MOCK_PORT}`);
      resolve();
    });
  });
}

/**
 * Stops the mock server.
 */
export function stopMockServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => {
      console.log("[MOCK] External API mock stopped.");
      server = null;
      resolve();
    });
  });
}
