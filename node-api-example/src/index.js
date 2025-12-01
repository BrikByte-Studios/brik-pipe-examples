/**
 * BrikByteOS — Express App Export
 * ---------------------------------------------------------
 * This file exposes the Express instance WITHOUT binding to
 * a network port. It exists so unit tests can import the app
 * directly without starting or stopping external listeners.
 *
 * Used by:
 *  - PIPE-TEST-UNIT-CI-BUILD-002
 *  - PIPE-CONTAINER-TEST-STACKS-TEST-006 (runtime smoke)
 */

import express from "express";

const app = express();

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

export default app;
