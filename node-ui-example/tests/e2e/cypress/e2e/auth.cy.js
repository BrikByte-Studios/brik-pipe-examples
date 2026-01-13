/**
 * Happy path:
 * login → dashboard → logout
 */

describe("Authentication flow", () => {
  it("login → dashboard → logout", () => {
    cy.fixture("testUsers").then((users) => {
      const u = users.default;

      cy.loginAs(u.email, u.password);
      cy.assertOnDashboard();

      cy.getByTestId("user-menu-toggle1").should("contain.text", u.displayName);

      cy.logout();
    });
  });
});
