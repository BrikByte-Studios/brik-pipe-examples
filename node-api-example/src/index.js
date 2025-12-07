/**
 * BrikByteOS — Express App Export
 * ---------------------------------------------------------
 * This file exposes the Express instance WITHOUT binding to
 * a network port. It exists so unit tests and integration
 * tests can import the app directly or via a small server
 * wrapper without starting listeners in test processes.
 *
 * Used by:
 *  - Unit test CI templates
 *  - Container runtime smoke checks
 */

import express from "express";

const app = express();

// Enable JSON body parsing for POST/PUT requests
app.use(express.json());

/**
 * GET /
 * Expected:
 *  - 200 JSON
 *  - { message: "Node API Example — BrikByteOS pipelines OK" }
 */
app.get("/", (req, res) => {
  res.json({ message: "Node API Example — BrikByteOS pipelines OK" });
});

/**
 * GET /health
 * CI + container smoke validation endpoint.
 * Must return 200 + plain text "OK" to satisfy runtime probe policy.
 */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/**
 * POST /payments
 * -------------------------------------------------------
 * Minimal “external payment” flow for integration tests.
 *
 * Your integration test expects:
 *   - status 200
 *   - body:
 *       {
 *         "status": "approved",
 *         "transactionId": "mock-tx-123"
 *       }
 *
 * For the example service we keep this handler simple and
 * deterministic — it does NOT call a real external provider.
 * The “mock external API” in tests demonstrates mocking
 * patterns, while this route returns the expected payload.
 */
app.post("/payments", (req, res) => {
  const { amount, currency } = req.body ?? {};

  // In a real service you’d validate amount/currency, persist
  // to DB, and call an external provider. Here we just return
  // a deterministic approved response for integration tests.
  if (typeof amount !== "number" || !currency) {
    return res.status(400).json({
      error: "amount (number) and currency are required",
    });
  }

  res.status(200).json({
    status: "approved",
    transactionId: "mock-tx-123",
  });
});

export default app;
