const { sum } = require("./sum");

test("sum works", () => {
  expect(sum(1, 2)).toBe(3);
});

test("sum handles negatives", () => {
  expect(sum(-1, -2)).toBe(-3);
});