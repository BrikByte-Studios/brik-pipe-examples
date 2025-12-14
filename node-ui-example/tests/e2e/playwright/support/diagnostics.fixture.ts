/**
 * Purpose
 * -------
 * Gold-standard diagnostics capture for Playwright failures:
 * - console.json  : browser console messages (type, text, location, timestamp)
 * - network.har   : full HAR for the test BrowserContext
 * - trace.zip     : Playwright trace viewer bundle
 * - dom.html      : last DOM snapshot (page.content()) on failure
 * - metadata.json : linkage to test/spec/browser + environment context
 *
 * Output
 * ------
 * Writes to:
 *   - process.env.PLAYWRIGHT_DIAG_DIR (preferred; set by CI), else:
 *   - <repo>/test-results/diagnostics (fallback)
 *
 * Notes
 * -----
 * - HAR + Trace require BrowserContext control. We create a new context per test.
 * - Trace is started at test start. On failure we stop + save trace.zip.
 * - HAR is recorded automatically and finalized when the context closes.
 * - Video is separate (handled by Playwright config + artifacts exporter).
 */

import { test as base, expect, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";

type ConsoleEntry = {
  ts: string;
  type: string;
  text: string;
  location?: { url?: string; lineNumber?: number; columnNumber?: number };
};

type Fixtures = {
  /**
   * IMPORTANT:
   * This fixture intentionally exposes a `page` fixture (not `diagPage`)
   * so product teams can write tests normally: `async ({ page }) => { ... }`
   */
  page: Page;
};

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeWriteText(filePath: string, content: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

function safeWriteJson(filePath: string, obj: unknown) {
  safeWriteText(filePath, JSON.stringify(obj, null, 2));
}

function touchEmptyFile(filePath: string) {
  ensureDir(path.dirname(filePath));
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, Buffer.from(""));
}

function resolveDiagDir(): string {
  const envDir = process.env.PLAYWRIGHT_DIAG_DIR?.trim();
  if (envDir) return envDir;
  return path.join(process.cwd(), "test-results", "diagnostics");
}

function buildMetadata(testInfo: TestInfo, browserName: string) {
  return {
    runner: "playwright",
    browser: browserName,
    status: testInfo.status,
    expectedStatus: testInfo.expectedStatus,

    testTitle: testInfo.title,
    file: testInfo.file,

    repo: process.env.GITHUB_REPOSITORY ?? null,
    sha: process.env.GITHUB_SHA ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,

    targetUrl: process.env.E2E_TARGET_URL ?? null,

    outputs: {
      console: "console.json",
      network: "network.har",
      trace: "trace.zip",
      dom: "dom.html",
      metadata: "metadata.json",
    },

    ts: new Date().toISOString(),
  };
}

/**
 * Export a `test` that behaves like normal Playwright `test`,
 * but with a controlled context + page so we can record diagnostics.
 */
export const test = base.extend<Fixtures>({
  page: async ({ browser }, use, testInfo) => {
    const diagDir = resolveDiagDir();
    ensureDir(diagDir);

    const consolePath = path.join(diagDir, "console.json");
    const harPath = path.join(diagDir, "network.har");
    const tracePath = path.join(diagDir, "trace.zip");
    const domPath = path.join(diagDir, "dom.html");
    const metaPath = path.join(diagDir, "metadata.json");

    const consoleEntries: ConsoleEntry[] = [];
    const browserName = testInfo.project.name || "unknown";

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // New context per test with HAR recording enabled
      context = await browser.newContext({
        recordHar: { path: harPath, content: "embed", mode: "full" },
      });

      // Start trace capture at the beginning
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });

      page = await context.newPage();

      // Capture console logs throughout the test
      page.on("console", (msg) => {
        const loc = msg.location();
        consoleEntries.push({
          ts: new Date().toISOString(),
          type: msg.type(),
          text: msg.text(),
          location: loc
            ? { url: loc.url, lineNumber: loc.lineNumber, columnNumber: loc.columnNumber }
            : undefined,
        });
      });

      // Provide the page to the test body
      await use(page);
    } finally {
      const failed = testInfo.status !== testInfo.expectedStatus;

      if (failed) {
        // Ensure required files exist even if capture partially fails
        touchEmptyFile(consolePath);
        touchEmptyFile(harPath);
        touchEmptyFile(tracePath);
        touchEmptyFile(domPath);
        touchEmptyFile(metaPath);

        // DOM snapshot
        try {
          if (page) {
            const html = await page.content();
            safeWriteText(domPath, html);
          } else {
            safeWriteText(domPath, "<!-- dom snapshot unavailable: page is null -->\n");
          }
        } catch (e) {
          safeWriteText(domPath, `<!-- dom snapshot failed: ${(e as Error).message} -->\n`);
        }

        // console.json
        safeWriteJson(consolePath, {
          runner: "playwright",
          browser: browserName,
          status: "failed",
          testTitle: testInfo.title,
          file: testInfo.file,
          ts: new Date().toISOString(),
          entries: consoleEntries,
        });

        // trace.zip (only persisted on failure)
        try {
          if (context) {
            await context.tracing.stop({ path: tracePath });
          } else {
            safeWriteText(path.join(diagDir, "trace.error.txt"), "Trace not captured: context is null\n");
          }
        } catch (e) {
          touchEmptyFile(tracePath);
          safeWriteText(path.join(diagDir, "trace.error.txt"), `Trace capture failed: ${(e as Error).message}\n`);
        }

        // metadata.json
        safeWriteJson(metaPath, buildMetadata(testInfo, browserName));
      } else {
        // On success, stop tracing without persisting artifacts
        try {
          if (context) await context.tracing.stop();
        } catch {
          /* non-fatal */
        }
      }

      // Closing context finalizes HAR
      try {
        if (context) await context.close();
      } catch {
        /* non-fatal */
      }
    }
  },
});

export { expect };
