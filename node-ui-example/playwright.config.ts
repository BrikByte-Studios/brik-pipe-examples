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

/**
 * Utility: parse integer environment variables with a safe default.
 *
 * @param envVarValue String value from process.env.
 * @param defaultValue Fallback if parsing fails or env var is not set.
 */
function parseIntEnv(envVarValue: string | undefined, defaultValue: number): number {
  const parsed = envVarValue ? Number.parseInt(envVarValue, 10) : Number.NaN;
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Utility: normalise the trace mode string into a valid Playwright option.
 *
 * Valid values per Playwright docs:
 * - "on"
 * - "on-first-retry"
 * - "retain-on-failure"
 * - "off"
 */
function getTraceModeFromEnv(
  envValue: string | undefined,
): 'on' | 'on-first-retry' | 'retain-on-failure' | 'off' {
  switch (envValue) {
    case 'on':
    case 'on-first-retry':
    case 'retain-on-failure':
    case 'off':
      return envValue;
    default:
      return 'on-first-retry';
  }
}

/**
 * Utility: resolve workers from env into a form Playwright accepts.
 *
 * Rules:
 * - If value ends with "%", treat it as a percentage string (e.g. "50%").
 * - Otherwise try to parse it as a positive integer (e.g. "1" -> 1).
 * - If parsing fails or value is invalid, fall back to "50%".
 *
 * Playwright requires workers to be:
 * - a number, or
 * - a percentage string (e.g. "50%").
 */
function resolveWorkers(envVal: string | undefined): number | string {
  const raw = envVal?.trim();

  // No value provided → default to "50%" as a sensible CI default.
  if (!raw) {
    return '50%';
  }

  // Percentage-based parallelism, e.g. "50%"
  if (raw.endsWith('%')) {
    return raw;
  }

  // Numeric workers, e.g. "1", "4"
  const num = Number(raw);
  if (!Number.isNaN(num) && num > 0) {
    return num;
  }

  // Fallback if invalid
  return '50%';
}

/**
 * Base URL for all tests.
 * - Controlled via E2E_TARGET_URL, which is set by the GitHub Actions workflow.
 * - Default points to a generic staging environment; individual repos can
 *   override this in CI or locally via .env files.
 */
const baseURL: string = process.env.E2E_TARGET_URL ?? 'https://staging.example.com';

/**
 * Flags that determine which browser projects are enabled.
 * - Chromium is always included.
 * - Firefox/WebKit are toggled via PW_ENABLE_FIREFOX / PW_ENABLE_WEBKIT.
 */
const enableFirefox: boolean = process.env.PW_ENABLE_FIREFOX === '1';
const enableWebkit: boolean = process.env.PW_ENABLE_WEBKIT === '1';

/**
 * Parallelism (workers) and retry count are controlled via environment variables.
 * This allows CI to tune sharding/throughput without changing the config file.
 */
const workersEnv: string | undefined = process.env.PW_WORKERS;
const retriesEnv: string | undefined = process.env.PW_RETRIES;

// ✅ FIX: convert env string into number or percentage string
const workers: number | string = resolveWorkers(workersEnv);
const retries: number = parseIntEnv(retriesEnv, 1);

const traceMode = getTraceModeFromEnv(process.env.PW_TRACE_MODE);

/**
 * Construct the list of browser projects based on enabled flags.
 * - Always includes Chromium (Desktop Chrome).
 * - Optionally includes Firefox and WebKit.
 */
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

/**
 * Main Playwright configuration for BrikByteOS UI E2E tests.
 */
const config: PlaywrightTestConfig = defineConfig({
  testDir: './tests/e2e/playwright',
  /* Global timeout for a single test (including hooks). */
  timeout: 30_000,
  expect: {
    /* Timeout for expect() assertions. */
    timeout: 10_000,
  },
  /* Global retries for tests – tuned via PW_RETRIES. */
  retries,
  /* Parallel workers – tuned via PW_WORKERS (number or "NN%"). */
  workers,
  /* Reporter configuration:
   * - "list" for human-readable CI logs.
   * - "html" writes to ./playwright-report for artifact upload.
   */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    /**
     * Base URL for page.goto('/') calls.
     * e.g. page.goto('/') → https://staging.example.com/
     */
    baseURL,
    /**
     * Headless by default – matches CI expectations.
     * Local debugging can override this via CLI: `npx playwright test --headed`.
     */
    headless: true,
    /**
     * Trace mode, controlled via PW_TRACE_MODE.
     * "on-first-retry" is a sensible default for E2E CI runs.
     */
    trace: traceMode,
    /**
     * Capture screenshot on failure to aid debugging.
     */
    screenshot: 'only-on-failure',
    /**
     * Capture console logs for inspection when tests fail.
     */
    console: 'retain-on-failure',
  },
  /**
   * Browser projects: Chromium (always) + optional Firefox/WebKit.
   * Each project is run independently; CI matrix is keyed by `PW_BROWSER`.
   */
  projects,
});

export default config;
