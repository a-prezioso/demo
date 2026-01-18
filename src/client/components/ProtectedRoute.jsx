"use strict";

const React = require("react");
const { useEffect, useState } = React;
const { Navigate, Outlet, useLocation } = require("react-router-dom");
const { useAuth } = require("../context/AuthContext");

// ProtectedRoute ensures only authenticated users can access its children/Outlet.
// Behaviour:
// - If authenticated: render children or Outlet
// - If not authenticated: try a token refresh once
// - If still unauthenticated: redirect to /login with state.from = current location
function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { isAuthenticated, refresh } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [didCheck, setDidCheck] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function tryRefresh() {
      if (isAuthenticated || didCheck) return;
      setChecking(true);
      try {
        await refresh();
      } catch (_e) {
        // ignore errors; redirect will happen below
      } finally {
        if (mounted) {
          setChecking(false);
          setDidCheck(true);
        }
      }
    }
    tryRefresh();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, didCheck, refresh]);

  if (isAuthenticated) {
    return children ? children : React.createElement(Outlet, null);
  }

  if (checking) {
    return null; // or a spinner placeholder
  }

  return React.createElement(Navigate, {
    to: redirectTo,
    replace: true,
    state: { from: location },
  });
}

// PublicOnlyRoute prevents authenticated users from accessing public pages like login/signup.
// It also attempts a silent refresh if a refresh token exists and access token is expired, to avoid flashing the login page.
// Optional defaultRedirect determines where to send authenticated users (defaults to /dashboard)
function PublicOnlyRoute({ children, defaultRedirect = "/dashboard" }) {
  const { isAuthenticated, refresh } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [didCheck, setDidCheck] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function maybeRefresh() {
      if (isAuthenticated || didCheck) return;
      setChecking(true);
      try {
        await refresh();
      } catch (_e) {
        // ignore
      } finally {
        if (mounted) {
          setChecking(false);
          setDidCheck(true);
        }
      }
    }
    maybeRefresh();
    return () => { mounted = false; };
  }, [isAuthenticated, didCheck, refresh]);

  if (!isAuthenticated) {
    if (checking) return null;
    return children ? children : React.createElement(Outlet, null);
  }

  // If user is already authenticated, prefer going back to requested "from" or default dashboard
  const from = (location && location.state && location.state.from && location.state.from.pathname) || defaultRedirect;
  return React.createElement(Navigate, { to: from, replace: true });
}

module.exports = {
  ProtectedRoute,
  PublicOnlyRoute,
};
