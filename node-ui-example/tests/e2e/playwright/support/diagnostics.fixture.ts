/**
 * Purpose
 * -------
 * Gold-standard diagnostics capture for Playwright:
 * - console.json: browser console messages (type, text, location, timestamp)
 * - network.har: full HAR for the test context
 * - trace.zip: Playwright trace viewer bundle
 * - dom.html: last DOM snapshot (page.content()) on failure
 *
 * Output
 * ------
 * Writes to: test-results/diagnostics/
 *   - console.json
 *   - network.har
 *   - trace.zip
 *   - dom.html
 *   - metadata.json (extra linkage to test/spec/browser)
 *
 * Notes
 * -----
 * - HAR + Trace require BrowserContext control. We create a new context per test.
 * - Video is separate (already handled by Playwright config + artifacts exporter).
 */

import { test as base, chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

type DiagFixtures = {
  diagPage: Page;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function safeWrite(p: string, content: string) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf-8");
}

export const test = base.extend<DiagFixtures>({
  diagPage: async ({}, use, testInfo) => {
    const outDir = testInfo.project.outputDir ?? "test-results";
    const diagDir = path.join(outDir, "diagnostics");
    ensureDir(diagDir);

    // Decide which engine to use based on project name (chromium/firefox/webkit)
    const projectName = testInfo.project.name;
    let browser: Browser;

    if (projectName === "firefox") browser = await firefox.launch();
    else if (projectName === "webkit") browser = await webkit.launch();
    else browser = await chromium.launch();

    const harPath = path.join(diagDir, "network.har");
    const tracePath = path.join(diagDir, "trace.zip");
    const consolePath = path.join(diagDir, "console.json");
    const domPath = path.join(diagDir, "dom.html");
    const metaPath = path.join(diagDir, "metadata.json");

    const consoleEntries: Array<{
      ts: string;
      type: string;
      text: string;
      location?: { url?: string; lineNumber?: number; columnNumber?: number };
    }> = [];

    // Create context with HAR recording (gold standard)
    const context: BrowserContext = await browser.newContext({
      recordHar: { path: harPath, content: "embed", mode: "full" },
    });

    // Trace capture: start at test start, stop on end; only keep on failure
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });

    const page = await context.newPage();

    // Console listener early (captures throughout test)
    page.on("console", (msg) => {
      const loc = msg.location();
      consoleEntries.push({
        ts: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: loc ? { url: loc.url, lineNumber: loc.lineNumber, columnNumber: loc.columnNumber } : undefined,
      });
    });

    // Run the test with our page
    await use(page);

    // After test finishes: decide whether to persist diagnostics
    const failed = testInfo.status !== testInfo.expectedStatus;

    if (failed) {
      // DOM snapshot
      try {
        const html = await page.content();
        safeWrite(domPath, html);
      } catch (e) {
        safeWrite(domPath, `<!-- dom snapshot failed: ${(e as Error).message} -->\n`);
      }

      // Console JSON
      safeWrite(
        consolePath,
        JSON.stringify(
          {
            testTitle: testInfo.title,
            file: testInfo.file,
            project: testInfo.project.name,
            status: testInfo.status,
            entries: consoleEntries,
          },
          null,
          2
        )
      );

      // Stop tracing and export trace.zip
      try {
        await context.tracing.stop({ path: tracePath });
      } catch (e) {
        safeWrite(tracePath, `trace capture failed: ${(e as Error).message}\n`);
      }

      // metadata.json (recommended linkage)
      safeWrite(
        metaPath,
        JSON.stringify(
          {
            testTitle: testInfo.title,
            file: testInfo.file,
            project: testInfo.project.name,
            status: testInfo.status,
            expectedStatus: testInfo.expectedStatus,
            harPath: "network.har",
            tracePath: "trace.zip",
            consolePath: "console.json",
            domPath: "dom.html",
            ts: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } else {
      // If not failed, stop tracing without saving (prevents heavy artifacts)
      await context.tracing.stop();
    }

    await context.close();
    await browser.close();
  },
});

export { expect } from "@playwright/test";
