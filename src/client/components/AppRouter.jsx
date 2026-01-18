"use strict";

const React = require("react");
const { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } = require("react-router-dom");
const { AuthProvider, useAuth } = require("../context/AuthContext.jsx");
const { ProtectedRoute, PublicOnlyRoute } = require("./ProtectedRoute.jsx");
const AuthPage = require("./AuthPage.jsx");

// Small wrapper to integrate AuthPage with AuthContext and navigation.
function AuthGate() {
  const { isAuthenticated, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // If already authenticated, redirect away from /login immediately
    if (isAuthenticated) {
      const from = (location && location.state && location.state.from && location.state.from.pathname) || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated]);

  async function handleAuthenticated(_user, _tokens) {
    // AuthPage has already stored tokens via authClient/tokenStorage.
    // Ensure AuthContext state is populated, then redirect.
    try {
      await refresh();
    } catch (_e) {
      // ignore
    }
    const from = (location && location.state && location.state.from && location.state.from.pathname) || "/dashboard";
    navigate(from, { replace: true });
  }

  return React.createElement(AuthPage, { onAuthenticated: handleAuthenticated });
}

// Placeholder pages for demonstration; replace with real app pages.
function Dashboard() {
  return React.createElement("div", { className: "page" }, "Dashboard");
}
function Timesheet() {
  return React.createElement("div", { className: "page" }, "Timesheet");
}
function Projects() {
  return React.createElement("div", { className: "page" }, "Projects");
}

function AppRouter() {
  return (
    React.createElement(AuthProvider, null,
      React.createElement(BrowserRouter, null,
        React.createElement(Routes, null,
          // Root: redirect based on auth state using a lightweight gate
          React.createElement(Route, { path: "/", element: React.createElement(RootRedirect, null) }),

          // Public-only routes
          React.createElement(Route, { element: React.createElement(PublicOnlyRoute, null) },
            React.createElement(Route, { path: "/login", element: React.createElement(AuthGate, null) }),
          ),

          // Protected application routes
          React.createElement(Route, { element: React.createElement(ProtectedRoute, null) },
            React.createElement(Route, { path: "/dashboard", element: React.createElement(Dashboard, null) }),
            React.createElement(Route, { path: "/timesheet", element: React.createElement(Timesheet, null) }),
            React.createElement(Route, { path: "/projects", element: React.createElement(Projects, null) }),
          ),

          // Fallback
          React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/", replace: true }) }),
        )
      )
    )
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? React.createElement(Navigate, { to: "/dashboard", replace: true })
    : React.createElement(Navigate, { to: "/login", replace: true });
}

module.exports = AppRouter;
