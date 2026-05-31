const { validateEnv, schema } = require("../src/config/env");

describe("env validation", () => {
  test("applies defaults", () => {
    delete process.env.RATE_LIMIT_MAX;
    validateEnv();
    expect(process.env.RATE_LIMIT_MAX).toBe(schema.defaults.RATE_LIMIT_MAX);
  });
});
