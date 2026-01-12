/**
 * Cypress E2E - Invalid login
 *
 * Covers:
 * - /login submit with wrong creds
 * - server returns 401 HTML page with "Invalid credentials"
 *
 * Note:
 * - Your Express app does NOT render the login form again on invalid login.
 * - It renders a simple 401 page containing "Invalid credentials" + link.
 */

describe("Invalid login", () => {
  it("shows invalid credentials message", () => {
    cy.visit("/login");

    cy.get('[data-testid="login-email"]').type("wrong@brikbyteos.local");
    cy.get('[data-testid="login-password"]').type("wrongpassword");
    cy.get('[data-testid="login-submit"]').click();

    // Express returns 401 + a page containing this text
    cy.contains("Invalid credentials").should("be.visible");
    cy.contains("Try again").should("be.visible");
  });
});
