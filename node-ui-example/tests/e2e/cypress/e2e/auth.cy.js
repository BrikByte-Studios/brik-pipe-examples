/**
 * Cypress E2E - Authentication happy-path
 *
 * Covers:
 * - /login form submit
 * - redirect to /dashboard
 * - logout returns to /login
 *
 * Assumptions:
 * - Express server is running at Cypress baseUrl (CYPRESS_baseUrl).
 * - Page contains the exact data-testid attributes from server.mjs.
 */

describe("Authentication flow", () => {
  it("login → dashboard → logout", () => {
    cy.visit("/login");

    cy.get('[data-testid="login-email"]').should("be.visible").type("test.user@brikbyteos.local");
    cy.get('[data-testid="login-password"]').should("be.visible").type("password123!");
    cy.get('[data-testid="login-submit"]').click();

    cy.url().should("include", "/dashboard");

    cy.get('[data-testid="dashboard-welcome"]')
      .should("be.visible")
      .and("contain", "Welcome to the BrikByteOS Demo Dashboard");

    cy.get('[data-testid="user-menu-toggle"]').click();
    cy.get('[data-testid="user-menu-logout"]').click();

    cy.url().should("include", "/login");
    cy.get('[data-testid="login-email"]').should("be.visible");
  });
});
