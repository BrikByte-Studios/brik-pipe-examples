/**
 * cypress.config.cjs  — BrikByteOS E2E v1 Contract
 *
 * Guarantees:
 *  • Always emits JUnit XML at: out/junit-e2e.xml
 *  • Always records screenshots & videos
 *  • baseUrl is controlled by CI via CYPRESS_baseUrl
 *  • Retries are controlled via CYPRESS_retries
 *  • Produces deterministic artifacts for .audit export
 *
 * This file is REQUIRED for Cypress normalization to go green.
 */

const { defineConfig } = require("cypress");

function envNumber(name, fallback) {
  const v = process.env[name];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

module.exports = defineConfig({
  // --- Evidence ---
  video: true,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,

  e2e: {
    // Controlled by CI
    baseUrl:
      process.env.CYPRESS_baseUrl ||
      process.env.BASE_URL ||
      "http://localhost:3000",

    specPattern: "tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "tests/e2e/cypress/support/e2e.js",

    retries: {
      runMode: envNumber("CYPRESS_retries", 1),
      openMode: 0,
    },

    // 🔐 REQUIRED FOR BRIKBYTEOS NORMALIZATION
    reporter: "junit",
    reporterOptions: {
      mochaFile: "out/junit-e2e.xml",
      toConsole: false,
      attachments: false,
    },

    defaultCommandTimeout: 8000,
    pageLoadTimeout: 60000,
    requestTimeout: 8000,
    responseTimeout: 8000,

    setupNodeEvents(on, config) {
      console.log(`[cypress] baseUrl=${config.baseUrl}`);
      return config;
    },
  },
});
