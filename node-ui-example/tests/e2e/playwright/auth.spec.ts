/**
 * Example E2E test suite for the golden path:
 *   Login → dashboard → logout.
 *
 * Purpose:
 * - Demonstrate how product teams should structure Playwright tests.
 * - Provide a stable, realistic flow for regression coverage.
 * - Serve as the reference for D-002 QA Automation Suite.
 *
 * Conventions used here:
 * - Selectors use data-testid attributes where possible (stable, not tied to text).
 * - The test relies on the baseURL set in playwright.config.ts (E2E_TARGET_URL).
 * - Routes and users are imported from centralized helpers/fixtures.
 * - Retries for this suite can be tuned independently via describe.configure.
 */

import { test, expect } from "./support/diagnostics.fixture";

// Centralized helpers (no hard-coded paths or credentials)
import { routes } from "./helpers/routes.js";
import { defaultStagingUser } from "./fixtures/testUsers.js";

/**
 * Configure this describe block with slightly higher retries than the global default
 * to absorb transient network/UI flakiness (while not masking real failures).
 */
test.describe.configure({ retries: 1 });

test.describe("Authentication flow", () => {
  test("login → dashboard → logout", async ({ page }) => {
    // ---------------------------------------------------------------------
    // 1) Navigate to the login page.
    // With baseURL configured, page.goto(routes.login) resolves to:
    //   E2E_TARGET_URL + routes.login
    // ---------------------------------------------------------------------
    await page.goto(routes.login);

    // ---------------------------------------------------------------------
    // 2) Fill in credentials using centralized test user fixture.
    // This avoids leaking hard-coded credentials inside the test body.
    // ---------------------------------------------------------------------
    await page.getByTestId("login-email").fill(defaultStagingUser.email);
    await page.getByTestId("login-password").fill(defaultStagingUser.password);

    // ---------------------------------------------------------------------
    // 3) Submit the login form.
    // ---------------------------------------------------------------------
    await page.getByTestId("login-submit").click();

    // ---------------------------------------------------------------------
    // 4) Assert that we land on the dashboard.
    // ---------------------------------------------------------------------
    await expect(page).toHaveURL(new RegExp(`${routes.dashboard}$`));

    // ---------------------------------------------------------------------
    // 5) Validate that a key dashboard element is visible
    // ---------------------------------------------------------------------
    await expect(page.getByTestId("dashboard-welcome")).toBeVisible();

    // ---------------------------------------------------------------------
    // 6) Perform logout via the "user menu".
    // NOTE:
    // - The server renders both user-menu-toggle and user-menu-logout.
    // - In a richer UI, toggle might open a dropdown; here it's always clickable.
    // ---------------------------------------------------------------------
    await page.getByTestId("user-menu-toggle").click();
    await page.getByTestId("user-menu-logout").click();

    // ---------------------------------------------------------------------
    // 7) Assert that the user is redirected back to the login page.
    // ---------------------------------------------------------------------
    await expect(page).toHaveURL(new RegExp(`${routes.login}$`));

    // ---------------------------------------------------------------------
    // 8) Optional: Validate that the login form is visible again.
    // This confirms a clean logout and ready state for the next test.
    // ---------------------------------------------------------------------
    await expect(page.getByTestId("login-email")).toBeVisible();
  });
});
