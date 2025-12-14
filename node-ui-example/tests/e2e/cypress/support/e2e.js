// Global Cypress support file for node-ui-example E2E tests.
//
// Responsibilities:
// - Global hooks and tiny helpers.
// - Best-effort failure diagnostics capture (Cypress parity with Playwright).
//
// IMPORTANT RUNTIME NOTE
// ----------------------
// This file runs in the browser context.
// Do NOT use fs/path here.
// All disk writes must happen via cy.task(...) implemented in cypress.config.js.
//
// Diagnostics contract (best-effort parity with Playwright):
// - console.json   → structured failure metadata + error (not full browser console)
// - dom.html       → DOM snapshot (document HTML) on failure
// - network.har    → placeholder / partial (Cypress has no native HAR export)
// - trace.zip      → placeholder (Cypress has no Playwright-style trace viewer)
//
// Producer output directory (written by Node tasks):
//   tests/e2e/cypress/diagnostics/
//
// Normalized + uploaded by:
//   capture-e2e-diagnostics.mjs → .audit/YYYY-MM-DD/e2e/diagnostics/

/// <reference types="cypress" />

/**
 * Minimal, best-effort redaction to reduce accidental leakage.
 * (Still: do NOT render secrets in test environments.)
 *
 * @param {string} input
 * @returns {string}
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
  const baseUrl = Cypress.config("baseUrl");
  // eslint-disable-next-line no-console
  console.log("[CYPRESS] Using baseUrl:", baseUrl);
});

/**
 * After each test, if it failed:
 *  - capture a DOM snapshot
 *  - build a structured "console.json" payload (failure context + error)
 *  - emit placeholders for network.har and trace.zip (contract stability)
 *  - write everything to disk via cy.task("diag:write", payload)
 */
afterEach(function () {
  const state = this.currentTest?.state;
  if (state !== "failed") return;

  const testTitle = this.currentTest?.title ?? "unknown";
  const suite = this.currentTest?.parent?.title ?? "";
  const spec = Cypress.spec?.relative ?? "";
  const browser = Cypress.browser?.name ?? "unknown";
  const baseUrl = Cypress.config("baseUrl") ?? "";

  const err = this.currentTest?.err;
  const errorBlock = err
    ? { message: err.message, stack: err.stack, name: err.name }
    : null;

  // DOM snapshot must be captured using Cypress commands.
  cy.document({ log: false }).then((doc) => {
    const domHtml = redactText(doc?.documentElement?.outerHTML || "<!-- dom snapshot empty -->\n");

    const consolePayload = {
      runner: "cypress",
      browser,
      status: "failed",
      testTitle,
      suite,
      spec,
      baseUrl,
      timestamp: new Date().toISOString(),
      error: errorBlock,
      note:
        "Cypress does not expose full browser console entries by default. This file contains structured failure context.",
      entries: [],
    };

    // HAR placeholder (valid JSON)
    const networkHar = {
      log: {
        version: "1.2",
        creator: { name: "cypress", version: Cypress.version ?? "unknown" },
        entries: [],
        comment:
          "Placeholder: Cypress does not natively export HAR. Use Playwright for full HAR, or implement cy.intercept aggregation for partial network logs.",
      },
    };

    // Trace placeholder (contract stability)
    const traceStub =
      "trace.zip not supported in Cypress. Placeholder to keep diagnostics contract stable.\n";

    // Write files via Node-side task (defined in cypress.config.js)
    cy.task(
      "diag:write",
      {
        console: consolePayload,
        domHtml,
        networkHar,
        traceStub,
      },
      { log: false }
    );

    // eslint-disable-next-line no-console
    console.log("[CYPRESS] Test failed — diagnostics written via cy.task(diag:write).");
  });
});
