"use strict";

// Export router-related components separately to avoid importing react-router-dom in Node-only contexts.
module.exports = {
  ProtectedRoute: require("./ProtectedRoute.jsx").ProtectedRoute,
  PublicOnlyRoute: require("./ProtectedRoute.jsx").PublicOnlyRoute,
  AppRouter: require("./AppRouter.jsx"),
};
