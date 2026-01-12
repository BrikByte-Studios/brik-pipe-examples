// If you already have other commands, merge these in.
// This file assumes your UI server uses these data-testid values:
// - login-email
// - login-password
// - login-submit
// - dashboard-welcome
// - user-menu-toggle
// - user-menu-logout

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Visit /login and log in using either:
       * - CYPRESS_TEST_USER_EMAIL / CYPRESS_TEST_USER_PASSWORD (CI), or
       * - fixtures/testUser.json fallback (local dev)
       */
      loginAsTestUser(): Chainable<void>;

      /**
       * Log out from the dashboard (expects user-menu-logout button).
       */
      logout(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginAsTestUser", () => {
  // Preferred: env vars injected by CI
  const envEmail = Cypress.env("TEST_USER_EMAIL") as string | undefined;
  const envPassword = Cypress.env("TEST_USER_PASSWORD") as string | undefined;

  const doLogin = (email: string, password: string, displayName?: string) => {
    cy.visit("/login");

    cy.get('[data-testid="login-email"]').should("be.visible").clear().type(email);
    cy.get('[data-testid="login-password"]')
      .should("be.visible")
      .clear()
      .type(password, { log: false });

    cy.get('[data-testid="login-submit"]').should("be.enabled").click();

    // Deterministic assertion: we land on /dashboard and see welcome
    cy.location("pathname").should("eq", "/dashboard");
    cy.get('[data-testid="dashboard-welcome"]').should("be.visible");

    // Optional: verify user display name on the menu button (if provided)
    if (displayName) {
      cy.get('[data-testid="user-menu-toggle"]').should("contain", displayName);
    }
  };

  // If env vars exist, use them. Otherwise fallback to fixture.
  if (envEmail && envPassword) {
    doLogin(envEmail, envPassword);
    return;
  }

  cy.fixture("testUser").then((user: { email: string; password: string; displayName?: string }) => {
    doLogin(user.email, user.password, user.displayName);
  });
});

Cypress.Commands.add("logout", () => {
  // Dashboard has a form POST /logout with button data-testid="user-menu-logout"
  cy.get('[data-testid="user-menu-logout"]').should("be.visible").click();

  // After logout the server redirects to /login
  cy.location("pathname").should("eq", "/login");
});

export {};
