/**
 * Minimal Express-based UI server for node-ui-example.
 *
 * This app exists purely to support Playwright E2E tests:
 * - /login       – login form
 * - /dashboard   – protected page after login
 * - /logout      – clears in-memory "session"
 *
 * NOTE:
 * - This is a deliberately simple, in-memory implementation.
 * - It is NOT suitable for production; it’s a deterministic demo for CI.
 */

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * In-memory "session" flag.
 *
 * For a single-user, CI-only demo this is sufficient.
 * In a real system you’d use proper session management (cookies, JWT, etc.).
 */
let loggedIn = false;

/**
 * Default test user.
 * Must be kept in sync with:
 *   tests/e2e/playwright/fixtures/testUsers.ts
 */
const TEST_USER = {
  email: "test.user@brikbyteos.local",
  password: "password123!",
  displayName: "Test User"
};

// Middleware to parse form-encoded bodies from <form method="post">
app.use(express.urlencoded({ extended: true }));

/**
 * Root route – redirect to /login for simplicity.
 */
app.get("/", (req, res) => {
  res.redirect("/login");
});

/**
 * GET /login
 *
 * Renders a minimal login form with data-testid attributes
 * that the Playwright E2E test relies on.
 */
app.get("/login", (req, res) => {
  // If already "logged in", shortcut to dashboard
  if (loggedIn) {
    return res.redirect("/dashboard");
  }

  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Login • BrikByteOS Demo</title>
  </head>
  <body>
    <h1>Login</h1>
    <form data-testid="login-form" action="/login" method="post">
      <label>
        Email
        <input
          data-testid="login-email"
          type="email"
          name="email"
          autocomplete="off"
        />
      </label>
      <br />
      <label>
        Password
        <input
          data-testid="login-password"
          type="password"
          name="password"
          autocomplete="off"
        />
      </label>
      <br />
      <button
        data-testid="login-submit"
        type="submit"
      >
        Login
      </button>
    </form>
  </body>
</html>`);
});

/**
 * POST /login
 *
 * Validates credentials against the test user and sets the in-memory
 * loggedIn flag. On success: redirect to /dashboard.
 */
app.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};

  const isValid =
    email === TEST_USER.email &&
    password === TEST_USER.password;

  if (!isValid) {
    // For demo: re-render login with a very simple "invalid" message.
    // (No extra test IDs needed for the current E2E flow.)
    return res.status(401).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Login • BrikByteOS Demo</title>
  </head>
  <body>
    <h1>Login</h1>
    <p style="color: red;">Invalid credentials</p>
    <a href="/login">Try again</a>
  </body>
</html>`);
  }

  loggedIn = true;
  return res.redirect("/dashboard");
});

/**
 * GET /dashboard
 *
 * Simple protected page that:
 * - Requires "loggedIn" flag
 * - Exposes expected data-testid attributes:
 *   - dashboard-welcome
 *   - user-menu-toggle
 *   - user-menu-logout
 */
app.get("/dashboard", (req, res) => {
  if (!loggedIn) {
    return res.redirect("/login");
  }

  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Dashboard • BrikByteOS Demo</title>
  </head>
  <body>
    <header>
      <h1 data-testid="dashboard-welcome">
        Welcome to the BrikByteOS Demo Dashboard
      </h1>

      <!-- Simple "user menu" representation -->
      <div data-testid="user-menu">
        <button
          type="button"
          data-testid="user-menu-toggle"
        >
          ${TEST_USER.displayName}
        </button>

        <!-- In a real app this might be shown/hidden via JS; here it's always visible
             so the E2E test can click it deterministically. -->
        <form
          data-testid="logout-form"
          action="/logout"
          method="post"
          style="display:inline-block; margin-left: 8px;"
        >
          <button
            type="submit"
            data-testid="user-menu-logout"
          >
            Logout
          </button>
        </form>
      </div>
    </header>

    <main>
      <p>Demo content for regression testing.</p>
    </main>
  </body>
</html>`);
});

/**
 * POST /logout
 *
 * Clears the in-memory "session" and sends user back to /login.
 */
app.post("/logout", (req, res) => {
  loggedIn = false;
  return res.redirect("/login");
});

/**
 * Start the HTTP server.
 */
app.listen(PORT, () => {
  console.log(`[node-ui-example] listening on http://localhost:${PORT}`);
});
