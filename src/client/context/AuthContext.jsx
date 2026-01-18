"use strict";

const React = require("react");
const { useState, useEffect, useMemo, useCallback, useContext } = React;
const authClient = require("../api/authClient");
const tokenStorage = require("../storage/tokenStorage");
const { decodeJwtPayload, isJwtExpired } = require("../utils/jwt");

// AuthContext provides: user, isAuthenticated, login, logout, signup, refresh, token
// Security note: tokens are stored in localStorage by default via tokenStorage.
// For production, prefer httpOnly, secure cookies set by the server to mitigate XSS.

const AuthContext = React.createContext({
  user: null,
  isAuthenticated: false,
  token: null,
  login: async (_email, _password) => {},
  signup: async (_email, _password) => {},
  logout: async () => {},
  refresh: async () => {},
});

function useHydrateFromAccessToken() {
  const [state, setState] = useState({ user: null, token: null, isAuthenticated: false });

  useEffect(() => {
    const at = tokenStorage.getAccessToken();
    if (!at) return;
    if (tokenStorage.isAccessTokenExpired()) return; // stale token, let refresh flow handle later
    const payload = decodeJwtPayload(at);
    if (payload && payload.sub) {
      setState({
        token: at,
        isAuthenticated: true,
        user: { id: payload.sub, email: payload.email, roles: payload.roles || [] },
      });
    }
  }, []);

  return state;
}

function AuthProvider({ children }) {
  const hydrated = useHydrateFromAccessToken();
  const [user, setUser] = useState(hydrated.user);
  const [token, setToken] = useState(hydrated.token);
  const [isAuthenticated, setIsAuthenticated] = useState(!!hydrated.isAuthenticated);
  const [loading, setLoading] = useState(false);

  // On hydration state change (first render), sync local states
  useEffect(() => {
    if (hydrated.token) setToken(hydrated.token);
    if (hydrated.user) setUser(hydrated.user);
    if (hydrated.isAuthenticated) setIsAuthenticated(true);
  }, [hydrated.token, hydrated.user, hydrated.isAuthenticated]);

  const applyLoginResponse = useCallback((data) => {
    // data: { accessToken, refreshToken, expiresIn, user }
    tokenStorage.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
    const payload = decodeJwtPayload(data.accessToken);
    const u = data.user || (payload ? { id: payload.sub, email: payload.email, roles: payload.roles || [] } : null);
    setUser(u);
    setToken(data.accessToken);
    setIsAuthenticated(true);
    return u;
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authClient.login({ email, password });
      return applyLoginResponse(data);
    } finally {
      setLoading(false);
    }
  }, [applyLoginResponse]);

  const signup = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await authClient.signup({ email, password });
      const data = await authClient.login({ email, password });
      return applyLoginResponse(data);
    } finally {
      setLoading(false);
    }
  }, [applyLoginResponse]);

  const refresh = useCallback(async () => {
    // If no refresh token, nothing to do
    const rt = tokenStorage.getRefreshToken();
    if (!rt) return null;
    const at = tokenStorage.getAccessToken();
    if (at && !isJwtExpired(at)) return { token: at };
    const data = await authClient.refresh({ rotate: true });
    const payload = decodeJwtPayload(data.accessToken);
    if (payload) {
      const u = user || { id: payload.sub, email: payload.email, roles: payload.roles || [] };
      setUser(u);
      setToken(data.accessToken);
      setIsAuthenticated(true);
      return { token: data.accessToken };
    }
    return null;
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await authClient.logout({ allSessions: false });
    } catch (_e) {
      // ignore network/server errors on logout; still clear client state
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    token,
    loading,
    login,
    signup,
    logout,
    refresh,
  }), [user, isAuthenticated, token, loading, login, signup, logout, refresh]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

function useAuth() {
  return useContext(AuthContext);
}

module.exports = {
  AuthProvider,
  useAuth,
  AuthContext,
};
