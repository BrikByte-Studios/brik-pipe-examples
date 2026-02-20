const { mul } = require("./mul");

test("mul works", () => {
  expect(mul(2, 3)).toBe(6);
});

// Example skipped test (exercise skip mapping)
test.skip("skipped example", () => {
  expect(true).toBe(false);
});

// Example todo test (exercise todo mapping)
test.todo("todo example");