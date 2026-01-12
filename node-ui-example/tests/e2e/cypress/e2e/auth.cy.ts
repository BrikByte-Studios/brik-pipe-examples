describe("Auth - login/dashboard/logout", () => {
  it("allows a test user to log in, see the dashboard, and log out", () => {
    cy.loginAsTestUser();

    // Logged in state assertions (command already checks dashboard-welcome)
    cy.get('[data-testid="user-menu"]').should("be.visible");

    // If fixture is used, displayName is asserted inside command.
    // If env vars are used, we can only assert the menu exists (unless you also pass displayName via env).
    cy.logout();

    cy.get('[data-testid="login-form"]').should("be.visible");
  });

  it("shows an error for invalid credentials and stays on login", () => {
    cy.visit("/login");

    cy.get('[data-testid="login-email"]').type("wrong@example.com");
    cy.get('[data-testid="login-password"]').type("invalid-password");
    cy.get('[data-testid="login-submit"]').click();

    cy.contains("Invalid credentials").should("be.visible");
    cy.contains("Try again").should("be.visible");
  });

  it("redirects /dashboard → /login when not logged in", () => {
    cy.visit("/dashboard");
    cy.location("pathname").should("eq", "/login");
    cy.get('[data-testid="login-form"]').should("be.visible");
  });

  it("redirects /login → /dashboard when already logged in", () => {
    cy.loginAsTestUser();

    // Now hit /login again — server redirects to /dashboard when loggedIn=true
    cy.visit("/login");
    cy.location("pathname").should("eq", "/dashboard");
    cy.get('[data-testid="dashboard-welcome"]').should("be.visible");

    // Clean up
    cy.logout();
    cy.location("pathname").should("eq", "/login");
  });
});