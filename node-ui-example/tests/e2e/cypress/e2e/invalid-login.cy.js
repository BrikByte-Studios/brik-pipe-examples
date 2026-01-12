/**
 * Negative path:
 * invalid credentials → 401 page + "Invalid credentials"
 */

describe("Invalid login", () => {
  it("shows invalid credentials message", () => {
    cy.fixture("testUsers").then((users) => {
      const bad = users.bad;

      cy.visit("/login");
      cy.getByTestId("login-email").clear().type(bad.email);
      cy.getByTestId("login-password").clear().type(bad.password, { log: false });
      cy.getByTestId("login-submit").click();

      cy.contains("Invalid credentials").should("be.visible");
      cy.contains("Try again").should("be.visible");
    });
  });
});
