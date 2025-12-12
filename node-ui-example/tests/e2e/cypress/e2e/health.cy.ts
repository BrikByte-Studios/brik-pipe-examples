// Health endpoint checks.
// This validates the readiness probe used by CI.

describe("Health - readiness probe", () => {
  it("GET /health returns 200 and expected JSON shape", () => {
    cy.request({
      method: "GET",
      url: "/health",
      failOnStatusCode: true,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("status", "ok");
      expect(res.body).to.have.property("service", "node-ui-example");
      expect(res.body).to.have.property("timestamp");
      expect(res.body.timestamp).to.be.a("number");
    });
  });
});
