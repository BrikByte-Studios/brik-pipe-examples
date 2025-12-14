// Global Cypress support file for node-ui-example E2E tests.
//
// Responsibilities:
// - Import custom commands (if any).
// - Basic before/after hooks that apply to all tests.
// - Tiny helpers for debugging or future extensions.
//
// Diagnostics contract (best-effort parity with Playwright):
// - console.json   → Cypress failure metadata + error + optional console buffer (if available)
// - dom.html       → DOM snapshot (document HTML) on failure
// - network.har    → placeholder / partial (Cypress has no native HAR export)
// - trace.zip      → placeholder (Cypress has no Playwright-style trace viewer)
//
// Output directory (producer):
//   tests/e2e/cypress/diagnostics/
// Normalized + uploaded by:
//   capture-e2e-diagnostics.mjs → .audit/YYYY-MM-DD/e2e/diagnostics/

/// <reference types="cypress" />

const fs = require("fs");
const path = require("path");

const DIAG_DIR = "tests/e2e/cypress/diagnostics";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeUtf8(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Best-effort DOM snapshot.
 * Note: Cypress runs inside the browser, so we can read DOM directly.
 */
function captureDomSnapshot() {
  try {
    // jQuery is available via Cypress.$
    const html = Cypress.$("html").prop("outerHTML");
    return typeof html === "string" && html.length > 0
      ? html
      : "<!-- dom snapshot empty -->\n";
  } catch (e) {
    return `<!-- dom snapshot failed: ${e?.message ?? String(e)} -->\n`;
  }
}

/**
 * Minimal, best-effort redaction to reduce accidental leakage.
 * (Still: do NOT render secrets in test environments.)
 */
function redactText(input) {
  if (!input) return input;

  let out = String(input);

  const patterns = [
    /Authorization:\s*Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    /(api[_-]?key|secret|token|password)\s*=\s*[^ \n\r\t"']+/gi,
    /("password"\s*:\s*)"[^"]*"/gi,
    /("token"\s*:\s*)"[^"]*"/gi,
    /("apiKey"\s*:\s*)"[^"]*"/gi,
  ];

  for (const p of patterns) {
    out = out.replace(p, (m, g1) => {
      if (g1) return `${g1}"[REDACTED]"`;
      return "[REDACTED]";
    });
  }

  return out;
}

// Example: log the baseUrl before the test run starts.
before(() => {
  // Cypress.config("baseUrl") is resolved from cypress.config.ts
  const baseUrl = Cypress.config("baseUrl");
  // eslint-disable-next-line no-console
  console.log("[CYPRESS] Using baseUrl:", baseUrl);
});

// After each test, write diagnostics if the test failed.
afterEach(function () {
  const state = this.currentTest?.state;

  if (state !== "failed") return;

  ensureDir(DIAG_DIR);

  // ----------------------------------------------------------------------------
  // 1) console.json (structured failure info)
  // ----------------------------------------------------------------------------
  const consolePayload = {
    runner: "cypress",
    browser: Cypress.browser?.name ?? "unknown",
    status: "failed",
    testTitle: this.currentTest?.title ?? "unknown",
    suite: this.currentTest?.parent?.title ?? "",
    spec: Cypress.spec?.relative ?? "",
    baseUrl: Cypress.config("baseUrl") ?? "",
    timestamp: new Date().toISOString(),
    error: this.currentTest?.err
      ? {
          message: this.currentTest.err.message,
          stack: this.currentTest.err.stack,
          name: this.currentTest.err.name,
        }
      : null,
    note:
      "Cypress does not provide full browser console entries by default. This file contains structured test failure context.",
    entries: [],
  };

  writeUtf8(
    path.join(DIAG_DIR, "console.json"),
    JSON.stringify(consolePayload, null, 2)
  );

  // ----------------------------------------------------------------------------
  // 2) dom.html (DOM snapshot)
  // ----------------------------------------------------------------------------
  const dom = redactText(captureDomSnapshot());
  writeUtf8(path.join(DIAG_DIR, "dom.html"), dom);

  // ----------------------------------------------------------------------------
  // 3) network.har (placeholder / partial)
  // ----------------------------------------------------------------------------
  // Cypress has no native HAR export. If later you implement cy.intercept aggregation,
  // you can replace this placeholder with a real "HAR-like" structure.
  writeUtf8(
    path.join(DIAG_DIR, "network.har"),
    JSON.stringify(
      {
        log: {
          version: "1.2",
          creator: { name: "cypress", version: Cypress.version ?? "unknown" },
          entries: [],
          comment:
            "Placeholder: Cypress does not natively export HAR. Use Playwright for full HAR, or implement cy.intercept aggregation for partial network logs.",
        },
      },
      null,
      2
    )
  );

  // ----------------------------------------------------------------------------
  // 4) trace.zip (placeholder)
  // ----------------------------------------------------------------------------
  // Cypress has no Playwright trace viewer bundle.
  writeUtf8(
    path.join(DIAG_DIR, "trace.zip"),
    "trace.zip not supported in Cypress. Placeholder to keep diagnostics contract stable.\n"
  );

  // eslint-disable-next-line no-console
  console.log("[CYPRESS] Test failed — diagnostics written to:", DIAG_DIR);
});
