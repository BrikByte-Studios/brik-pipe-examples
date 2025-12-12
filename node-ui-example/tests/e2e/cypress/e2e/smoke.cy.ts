// Smoke E2E test for node-ui-example.
// Exercises the happy-path auth flow:
//
// 1. Visit /login
// 2. Submit valid credentials from fixture
// 3. Assert dashboard welcome message is visible
// 4. Use the "user menu" to log out
// 5. Assert we are back on /login
//
// This gives:
// - Fast confidence that the UI server + routes work
// - A realistic example for other teams to copy

describe("Smoke - login → dashboard → logout", () => {
  it("allows a test user to log in, see the dashboard, and log out", () => {
    // Load credentials from fixture so tests & server share the same source of truth.
    cy.fixture("testUser").then((user) => {
      // STEP 1: go to /login (baseUrl + /login)
      cy.visit("/login");

      // Form + fields exist:
      cy.get('[data-testid="login-form"]').should("be.visible");
      cy.get('[data-testid="login-email"]').should("be.visible");
      cy.get('[data-testid="login-password"]').should("be.visible");

      // STEP 2: fill in credentials and submit.
      cy.get('[data-testid="login-email"]').type(user.email);
      cy.get('[data-testid="login-password"]').type(user.password);
      cy.get('[data-testid="login-submit"]').click();

      // STEP 3: dashboard should be visible.
      cy.url().should("include", "/dashboard");

      cy.get('[data-testid="dashboard-welcome"]')
        .should("be.visible")
        .and("contain", "BrikByteOS Demo");

      // User menu elements:
      cy.get('[data-testid="user-menu"]').should("be.visible");
      cy.get('[data-testid="user-menu-toggle"]')
        .should("be.visible")
        .and("contain", user.displayName);

      // STEP 4: click logout button.
      cy.get('[data-testid="user-menu-logout"]').click();

      // STEP 5: we should be redirected back to /login.
      cy.url().should("include", "/login");
      cy.get('[data-testid="login-form"]').should("be.visible");
    });
  });

  it("shows an error for invalid credentials", () => {
    // Try obviously invalid credentials.
    cy.visit("/login");

    cy.get('[data-testid="login-email"]').type("wrong@example.com");
    cy.get('[data-testid="login-password"]').type("invalid-password");
    cy.get('[data-testid="login-submit"]').click();

    // For now your server returns a 401 page with this text:
    cy.contains("Invalid credentials").should("be.visible");
  });
});
