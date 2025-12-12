// Global Cypress support file for node-ui-example E2E tests.
//
// Responsibilities:
// - Import custom commands (if any).
// - Basic before/after hooks that apply to all tests.
// - Tiny helpers for debugging or future extensions.

/// <reference types="cypress" />

// Example: log the baseUrl before the test run starts.
before(() => {
  // Cypress.config("baseUrl") is resolved from cypress.config.ts
  const baseUrl = Cypress.config("baseUrl");
  // This shows up in Cypress logs and CI logs.
  // Helpful when you’re switching between staging/local.
  // eslint-disable-next-line no-console
  console.log("[CYPRESS] Using baseUrl:", baseUrl);
});

// After each test, we can hook in extra diagnostics if needed.
afterEach(function () {
  if (this.currentTest?.state === "failed") {
    // Place for future debugging hooks / console log extraction etc.
    // For now we rely on screenshots + videos from Cypress defaults.
    // eslint-disable-next-line no-console
    console.log("[CYPRESS] Test failed, artifacts should be captured.");
  }
});
