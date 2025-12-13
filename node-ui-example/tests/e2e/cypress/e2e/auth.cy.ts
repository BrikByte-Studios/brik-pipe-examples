// Auth-focused E2E checks for node-ui-example.
// Covers:
// - happy-path login → dashboard → logout
// - invalid credentials
// - dashboard guard redirect when not logged in
// - visiting /login while logged in redirects to /dashboard
//
// Notes about the server:
// - Auth is in-memory ("loggedIn" boolean), so Cypress runs must be serial/isolated.
// - We log out at the end of tests that log in to keep state clean

describe("Auth - login/dashboard/logout", () => {
  it("allows a test user to log in, see the dashboard, and log out", () => {
    cy.fixture("testUser").then((user) => {
      cy.visit("/login");

      cy.get('[data-testid="login-form"]').should("be.visible");
      cy.get('[data-testid="login-email"]').should("be.visible").type(user.email);
      cy.get('[data-testid="login-password"]').should("be.visible").type(user.password);
      cy.get('[data-testid="login-submit"]').click();

      cy.url().should("include", "/dashboard");
      cy.get('[data-testid="dashboard-welcome"]')
        .should("be.visible")
        .and("contain", "BrikByteOS Demo");

      cy.get('[data-testid="user-menu"]').should("be.visible");
      cy.get('[data-testid="user-menu-toggle"]')
        .should("be.visible")
        .and("contain", user.displayName);

      cy.get('[data-testid="user-menu-logout1"]').click();

      cy.url().should("include", "/login");
      cy.get('[data-testid="login-form"]').should("be.visible");
    });
  });

  it("shows an error for invalid credentials and stays on login", () => {
    cy.visit("/login");

    cy.get('[data-testid="login-email"]').type("wrong@example.com");
    cy.get('[data-testid="login-password"]').type("invalid-password");
    cy.get('[data-testid="login-submit"]').click();

    cy.contains("Invalid credentials").should("be.visible");
    // The invalid credentials page includes a link back to /login:
    cy.contains("Try again").should("be.visible");
  });

  it("redirects /dashboard → /login when not logged in", () => {
    cy.visit("/dashboard");
    cy.url().should("include", "/login");
    cy.get('[data-testid="login-form"]').should("be.visible");
  });

  it("redirects /login → /dashboard when already logged in", () => {
    cy.fixture("testUser").then((user) => {
      // Log in
      cy.visit("/login");
      cy.get('[data-testid="login-email"]').type(user.email);
      cy.get('[data-testid="login-password"]').type(user.password);
      cy.get('[data-testid="login-submit"]').click();

      cy.url().should("include", "/dashboard");
      cy.get('[data-testid="dashboard-welcome"]').should("be.visible");

      // Now hit /login again — server redirects to /dashboard when loggedIn=true
      cy.visit("/login");
      cy.url().should("include", "/dashboard");
      cy.get('[data-testid="dashboard-welcome"]').should("be.visible");

      // Clean up
      cy.get('[data-testid="user-menu-logout"]').click();
      cy.url().should("include", "/login");
    });
  });
});
