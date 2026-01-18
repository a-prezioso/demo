"use strict";

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/security/**/*.js",
    "src/models/**/*.js"
  ],
  coverageReporters: ["text", "lcov"],
};
