module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/docs/**",
  ],
  coverageThreshold: {
    global: { statements: 25, branches: 15, functions: 25, lines: 25 },
  },
  testTimeout: 15000,
};
