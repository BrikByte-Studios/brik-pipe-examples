/**
 * Cypress custom commands for node-ui-example.
 * Centralizes selectors + common flows.
 */

Cypress.Commands.add("getByTestId", (testId, options = {}) => {
  return cy.get(`[data-testid="${testId}"]`, options);
});

Cypress.Commands.add("visitLogin", () => {
  cy.visit("/login");
  cy.getByTestId("login-form").should("be.visible");
});

Cypress.Commands.add("loginAs", (email, password) => {
  cy.visitLogin();

  cy.getByTestId("login-email").clear().type(email);
  cy.getByTestId("login-password").clear().type(password, { log: false });
  cy.getByTestId("login-submit").click();
});

Cypress.Commands.add("assertOnDashboard", () => {
  cy.location("pathname", { timeout: 8000 }).should("eq", "/dashboard");
  cy.getByTestId("dashboard-welcome").should("be.visible");
  cy.getByTestId("user-menu-toggle").should("be.visible");
  cy.getByTestId("user-menu-logout").should("be.visible");
});

Cypress.Commands.add("logout", () => {
  cy.getByTestId("user-menu-logout").click();
  cy.location("pathname", { timeout: 8000 }).should("eq", "/login");
  cy.getByTestId("login-form").should("be.visible");
});
