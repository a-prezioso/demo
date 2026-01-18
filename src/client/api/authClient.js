"use strict";

// Minimal auth API client for the PWA
// Exposes: signup, login, refresh, logout
// Uses fetch and tokenStorage to persist tokens

const tokenStorage = require("../storage/tokenStorage");

const API_BASE = process.env.API_BASE_URL || "/api";

async function parseJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (_e) {
    return {};
  }
}

function headers(json = true, withAuth = false) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (withAuth) {
    const at = tokenStorage.getAccessToken();
    if (at) h["Authorization"] = `Bearer ${at}`;
  }
  return h;
}

async function signup({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: headers(true, false),
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data && data.error ? data.error : "Signup failed");
  }
  return data; // { id, email, status, created_at, updated_at }
}

async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: headers(true, false),
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data && data.error ? data.error : "Login failed");
  }
  // Expected: { accessToken, refreshToken, tokenType, expiresIn, user }
  tokenStorage.setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  });
  return data;
}

async function refresh({ rotate = true } = {}) {
  const rt = tokenStorage.getRefreshToken();
  if (!rt) throw new Error("Missing refresh token");
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: headers(true, false),
    body: JSON.stringify({ refreshToken: rt, rotate }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data && data.error ? data.error : "Refresh failed");
  }
  // If rotate=true, new refresh token is returned
  tokenStorage.setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || rt,
    expiresIn: data.expiresIn,
  });
  return data;
}

async function logout({ allSessions = false } = {}) {
  const rt = tokenStorage.getRefreshToken();
  const at = tokenStorage.getAccessToken();
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: headers(true, !!at),
    body: JSON.stringify({ refreshToken: rt, allSessions }),
  });
  // On success or failure, clear local tokens to be safe
  tokenStorage.clearTokens();
  if (!res.ok) {
    const data = await parseJson(res);
    throw new Error(data && data.error ? data.error : "Logout failed");
  }
  return true;
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
};
