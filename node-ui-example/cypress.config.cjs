// Baseline Cypress configuration for node-ui-example.
//
// Key behaviours:
// - baseUrl is driven by env (CYPRESS_BASE_URL or E2E_TARGET_URL).
// - Retries are controlled via env (CYPRESS_RUN_MODE_RETRIES / CYPRESS_OPEN_MODE_RETRIES).
// - Specs live under tests/e2e/cypress/e2e/**/*.cy.(js|ts|…).
// - Screenshots and videos go under tests/e2e/cypress/{screenshots,videos}.
// - Designed to be CI-friendly and fully offline.
//
// Diagnostics contract (PIPE-E2E-DIAGNOSTICS-INTEG-005)
// ----------------------------------------------------
// Producer output directory (written by Node-side tasks):
//   tests/e2e/cypress/diagnostics/
//     - console.json   (structured failure context; not full browser console)
//     - dom.html       (document.documentElement.outerHTML on failure)
//     - network.har    (placeholder or partial; Cypress has no native HAR export)
//     - trace.zip      (placeholder; Cypress does not emit Playwright-style traces)
//
// These files are later normalized into:
//   .audit/YYYY-MM-DD/e2e/diagnostics/
// by the capture-e2e-diagnostics action.
//

const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

// Small helpers to safely parse env vars into numbers.
function parseIntEnv(value, fallback) {
  const parsed = value ? Number.parseInt(String(value), 10) : Number.NaN;
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Ensure a directory exists (recursive).
 *
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Write UTF-8 content to disk, ensuring parent directories exist.
 *
 * @param {string} filePath - Destination file path
 * @param {string} content - UTF-8 content
 */
function writeUtf8(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
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

module.exports = defineConfig({
  e2e: {
    // Where Cypress looks for E2E specs:
    specPattern: "tests/e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    // Support file (global setup, hooks, custom commands).
    supportFile: "tests/e2e/cypress/support/e2e.js",

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

    /**
     * setupNodeEvents
     * --------------
     * Runs in the Node process (NOT the browser).
     *
     * This is the correct place to write diagnostics to disk.
     * Browser-side code (support/e2e.js) must call `cy.task(...)` to persist files.
     */
    setupNodeEvents(on, config) {
      /**
       * Task: diag:write
       * ---------------
       * Writes Cypress diagnostics files into:
       *   tests/e2e/cypress/diagnostics/
       *
       * Expected payload shape:
       *   {
       *     console: object (will be JSON stringified),
       *     domHtml: string,
       *     networkHar: object (optional),
       *     traceStub: string (optional)
       *   }
       *
       * Notes:
       * - Cypress does not expose full browser console logs by default.
       *   We typically store structured failure context + error details in console.json.
       * - Cypress does not natively export HAR; network.har is placeholder or partial
       *   unless you implement intercept aggregation later.
       * - Cypress does not emit Playwright-style trace.zip; trace.zip is placeholder
       *   to keep the cross-runner contract stable for RootCauseExplainer.
       */
      on("task", {
        "diag:write"(payload) {
          const diagDir = "tests/e2e/cypress/diagnostics";
          ensureDir(diagDir);

          const consolePath = path.join(diagDir, "console.json");
          const domPath = path.join(diagDir, "dom.html");
          const networkPath = path.join(diagDir, "network.har");
          const tracePath = path.join(diagDir, "trace.zip");

          // console.json (structured context; not full browser logs)
          writeUtf8(consolePath, JSON.stringify(payload?.console ?? {}, null, 2));

          // dom.html (snapshot)
          writeUtf8(domPath, payload?.domHtml ?? "<!-- dom missing -->\n");

          // network.har (placeholder/partial)
          const defaultHar = {
            log: {
              version: "1.2",
              creator: { name: "cypress", version: config?.version ?? "unknown" },
              entries: [],
              comment:
                "Placeholder: Cypress does not natively export HAR. Implement intercept aggregation for partial logs if needed.",
            },
          };
          writeUtf8(networkPath, JSON.stringify(payload?.networkHar ?? defaultHar, null, 2));

          // trace.zip (placeholder)
          writeUtf8(
            tracePath,
            payload?.traceStub ??
              "trace.zip not supported in Cypress. Placeholder to keep contract stable.\n"
          );

          return null; // required by Cypress tasks
        },
      });

      return config;
    },
  },
});
