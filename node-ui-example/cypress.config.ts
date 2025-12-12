// Baseline Cypress configuration for node-ui-example.
//
// Key behaviours:
// - baseUrl is driven by env (CYPRESS_BASE_URL or E2E_TARGET_URL).
// - Retries are controlled via env (CYPRESS_RUN_MODE_RETRIES / CYPRESS_OPEN_MODE_RETRIES).
// - Specs live under tests/e2e/cypress/e2e/**/*.cy.(js|ts|…).
// - Screenshots and videos go under tests/e2e/cypress/{screenshots,videos}.
// - Designed to be CI-friendly and fully offline.

import { defineConfig } from "cypress";

// Small helpers to safely parse env vars into numbers.
function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isNaN(parsed) ? fallback : parsed;
}

// Base URL priority:
// 1) CYPRESS_BASE_URL (standard Cypress convention)
// 2) E2E_TARGET_URL  (shared with Playwright / other tooling)
// 3) Hardcoded default for local dev
const baseUrl =
  process.env.CYPRESS_BASE_URL ??
  process.env.E2E_TARGET_URL ??
  "http://localhost:3000";

// Retries (runMode = CI, openMode = local)
const runModeRetries = parseIntEnv(process.env.CYPRESS_RUN_MODE_RETRIES, 2);
const openModeRetries = parseIntEnv(process.env.CYPRESS_OPEN_MODE_RETRIES, 0);

export default defineConfig({
  e2e: {
    // Where Cypress looks for E2E specs:
    specPattern: "tests/e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    // Support file (global setup, hooks, custom commands).
    supportFile: "tests/e2e/cypress/support/e2e.ts",

    fixturesFolder: "tests/e2e/cypress/fixtures",

    // Base URL for cy.visit("/")
    baseUrl,

    // Retries configuration:
    retries: {
      runMode: runModeRetries,
      openMode: openModeRetries,
    },

    // Folders for artifacts (relative to repo root/service_workdir):
    screenshotsFolder: "tests/e2e/cypress/screenshots",
    videosFolder: "tests/e2e/cypress/videos",

    // Good defaults for CI:
    video: true,
    screenshotOnRunFailure: true,

    // Helpful for debugging network issues:
    setupNodeEvents(on, config) {
      // You can add reporters / tasks here if needed later.
      // For now, we just return config untouched.
      return config;
    },
  },
});
