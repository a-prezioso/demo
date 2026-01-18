"use strict";

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/security/**/*.js",
    "src/models/**/*.js",
    "src/api/**/*.js"
  ],
  coverageReporters: ["text", "lcov"],
};
