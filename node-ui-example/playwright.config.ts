// Baseline Playwright configuration for BrikByteOS E2E tests.
// This file is designed to be:
// - Shared and copy-pastable across product repos.
// - Driven by environment variables set in the reusable workflow.
// - Opinionated but still extendable per-repo.
//
// Key behaviours:
// - Headless by default.
// - Base URL comes from process.env.E2E_TARGET_URL (staging by default).
// - Multi-browser projects (Chromium mandatory, Firefox/WebKit optional).
// - Parallel workers controlled via PW_WORKERS.
// - Global retries controlled via PW_RETRIES.
// - Trace mode controlled via PW_TRACE_MODE.
// - HTML report written to ./playwright-report.
//

import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

function parseIntEnv(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

function resolveWorkers(value: string | undefined): number | string {
  if (!value) return '50%';
  const v = value.trim();
  if (v.endsWith('%')) return v;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : '50%';
}

function getTraceMode(
  value: string | undefined,
): 'on' | 'on-first-retry' | 'retain-on-failure' | 'off' {
  switch (value) {
    case 'on':
    case 'on-first-retry':
    case 'retain-on-failure':
    case 'off':
      return value;
    default:
      return 'on-first-retry';
  }
}

function getVideoMode(
  value: string | undefined,
): 'on' | 'off' | 'retain-on-failure' | 'on-first-retry' {
  switch (value) {
    case 'on':
    case 'off':
    case 'retain-on-failure':
    case 'on-first-retry':
      return value;
    default:
      return 'retain-on-failure';
  }
}

/* -------------------------------------------------------------------------- */
/* Environment                                                                 */
/* -------------------------------------------------------------------------- */

const baseURL = process.env.E2E_TARGET_URL ?? 'http://localhost:3000';

const workers = resolveWorkers(process.env.PW_WORKERS);
const retries = parseIntEnv(process.env.PW_RETRIES, 1);

const traceMode = getTraceMode(process.env.PW_TRACE_MODE);
const videoMode = getVideoMode(process.env.PW_VIDEO_MODE);

const enableFirefox = process.env.PW_ENABLE_FIREFOX === '1';
const enableWebkit = process.env.PW_ENABLE_WEBKIT === '1';

/* -------------------------------------------------------------------------- */
/* Browser Projects                                                            */
/* -------------------------------------------------------------------------- */

const projects: PlaywrightTestConfig['projects'] = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
    },
  },
];

if (enableFirefox) {
  projects.push({
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
    },
  });
}

if (enableWebkit) {
  projects.push({
    name: 'webkit',
    use: {
      ...devices['Desktop Safari'],
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Final Config                                                                */
/* -------------------------------------------------------------------------- */

const config: PlaywrightTestConfig = defineConfig({
  testDir: './tests/e2e/playwright',

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  retries,
  workers,

  // Explicit output dir so exporter always knows where to look
  outputDir: 'test-results',

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL,

    headless: true,

    /**
     * CRITICAL FIX:
     * Video MUST be explicitly enabled or Playwright will never record it.
     */
    video: videoMode,

    /**
     * Trace support (used by exporter)
     */
    trace: traceMode,

    /**
     * Screenshot capture (exporter expects these)
     */
    screenshot: 'only-on-failure',

    /**
     * Console logs retained for failure diagnostics
     */
    console: 'retain-on-failure',
  },

  projects,
});

export default config;