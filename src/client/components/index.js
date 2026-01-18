"use strict";

module.exports = {
  AuthPage: require("./AuthPage.jsx"),
  LoginForm: require("./LoginForm.jsx"),
  SignupForm: require("./SignupForm.jsx"),
  // Note: ProtectedRoute and AppRouter are intentionally not exported here to avoid bringing in
  // react-router-dom as a hard dependency for consumers that only need headless modules in Node tests.
};
