/**
 * Unit Tests — BrikByteOS Node Example
 * Target endpoints:
 *   GET /
 *   GET /health
 *
 * Test Runner executed via:
 *   make test → npm test → jest
 */
import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/index.js";

describe("GET /", () => {
  it("should return BrikByteOS OK JSON response", async () => {
    const res = await request(app).get("/");
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: "Node API Example — BrikByteOS pipelines OK",
    });
  });
});

describe("GET /health", () => {
  it("should return plain text 'OK' for CI smoke", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.statusCode, 200);
    assert.equal(res.text, "OK");
  });
});
