/**
 * Cypress config for node-ui-example.
 *
 * Location:
 *   tests/e2e/cypress/cypress.config.cjs
 *
 * CI contract:
 * - JUnit output written to: out/junit-e2e.xml
 * - screenshots: tests/e2e/cypress/cypress/screenshots (default)
 * - videos:      tests/e2e/cypress/cypress/videos (default)
 */

const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // IMPORTANT: Workflow should set CYPRESS_baseUrl=http://localhost:3000
    baseUrl: process.env.CYPRESS_baseUrl || process.env.BASE_URL || "http://localhost:3000",

    // Specs live here (under your tests/e2e structure)
    specPattern: "tests/e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    supportFile: "tests/e2e/cypress/support/e2e.js",

    // Evidence
    screenshotOnRunFailure: true,
    video: true,

    // Reduce random flake in CI (your app is simple, but this helps future growth)
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 20000,

    // If you later set retries from workflow, Cypress will override this via env/config
    retries: {
      runMode: Number(process.env.CYPRESS_retries || 1),
      openMode: 0
    }
  },

  // Reporter contract (v1): always emit JUnit for the normalizer.
  reporter: "junit",
  reporterOptions: {
    mochaFile: "out/junit-e2e.xml",
    toConsole: false,
    attachments: true
  }
});
