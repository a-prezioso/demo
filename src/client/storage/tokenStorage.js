"use strict";

// Token storage for access and refresh tokens
// - Stores in localStorage by default (can be switched to sessionStorage via setStorage)
// - Persists: accessToken, refreshToken, accessTokenExpiresAt (epoch ms)
// - Never logs token values

let storage = null;

function getStorage() {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) {
    storage = window.localStorage;
  } else {
    // Fallback in non-browser env (no-op in SSR/tests)
    storage = {
      _m: new Map(),
      setItem(k, v) { this._m.set(k, String(v)); },
      getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
      removeItem(k) { this._m.delete(k); },
    };
  }
  return storage;
}

const KEYS = {
  access: "sd_access_token",
  refresh: "sd_refresh_token",
  exp: "sd_access_expires_at",
};

function setTokens({ accessToken, refreshToken, expiresIn }) {
  const s = getStorage();
  if (typeof accessToken === "string") s.setItem(KEYS.access, accessToken);
  if (typeof refreshToken === "string") s.setItem(KEYS.refresh, refreshToken);
  if (Number.isFinite(expiresIn)) {
    const expiresAt = Date.now() + Math.max(0, expiresIn) * 1000;
    s.setItem(KEYS.exp, String(expiresAt));
  }
}

function getAccessToken() {
  return getStorage().getItem(KEYS.access);
}

function getRefreshToken() {
  return getStorage().getItem(KEYS.refresh);
}

function getAccessTokenExpiresAt() {
  const v = getStorage().getItem(KEYS.exp);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function isAccessTokenExpired(leewaySec = 10) {
  const exp = getAccessTokenExpiresAt();
  if (!exp) return true;
  return Date.now() >= exp - Math.max(0, leewaySec) * 1000;
}

function clearTokens() {
  const s = getStorage();
  s.removeItem(KEYS.access);
  s.removeItem(KEYS.refresh);
  s.removeItem(KEYS.exp);
}

function setStorage(customStorage) {
  storage = customStorage || null;
}

module.exports = {
  setTokens,
  getAccessToken,
  getRefreshToken,
  getAccessTokenExpiresAt,
  isAccessTokenExpired,
  clearTokens,
  setStorage,
};
