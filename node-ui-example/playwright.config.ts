/**
 * Playwright config for BrikByteOS E2E example.
 *
 * Key policy:
 * - Trace on first retry (good default for CI without huge storage costs).
 * - HTML report is always produced.
 * - Output dirs align with the BrikByteOS workflow defaults.
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || process.env.APP_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Canonical directories expected by the workflow
  outputDir: "test-results",

  reporter: [
      ["html", { open: "never" }],
      ["json", { outputFile: "test-results/report.json" }]
  ],

  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
});
