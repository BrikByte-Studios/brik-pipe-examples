import express from "express";

const app = express();

/**
 * Default root response
 */
app.get("/", (req, res) => {
  res.json({ message: "Node API Example — BrikByteOS pipelines OK" });
});

/**
 * Self-test health probe (for CI container-matrix)
 * Used by PIPE-CONTAINER-TEST-STACKS-TEST-006 for runtime smoke validation.
 * Returns HTTP 200 + text body to satisfy GOV-IMAGES-TAG-POLICY requirements.
 */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
