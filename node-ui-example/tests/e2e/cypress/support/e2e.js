/**
 * Cypress global setup for node-ui-example.
 *
 * Fail fast if baseUrl is missing; ensure deterministic start state.
 */

import "./commands";

before(() => {
  const baseUrl = Cypress.config("baseUrl");
  if (!baseUrl) {
    throw new Error(
      "[cypress] baseUrl is missing. Set CYPRESS_baseUrl (or config baseUrl)."
    );
  }
  console.log("[CYPRESS] Using baseUrl:", baseUrl);
});

beforeEach(() => {
  // Always begin from login to avoid state leakage.
  cy.visit("/login");
});
