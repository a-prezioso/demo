"use strict";

const http = require("./httpClient");
const tokenStorage = require("../storage/tokenStorage");

async function login({ email, password }) {
  const res = await http.post("/api/auth/login", { email, password });
  // Persist tokens to survive refresh
  if (res && res.accessToken) {
    tokenStorage.setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken, expiresIn: res.expiresIn });
  }
  return res;
}

async function signup({ email, password }) {
  const res = await http.post("/api/auth/signup", { email, password });
  return res;
}

async function refresh({ rotate = true } = {}) {
  const res = await http.post("/api/auth/refresh", { rotate });
  if (res && res.accessToken) {
    tokenStorage.setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken, expiresIn: res.expiresIn });
  }
  return res;
}

async function logout({ allSessions = false } = {}) {
  try {
    await http.post("/api/auth/logout", { allSessions });
  } finally {
    tokenStorage.clearTokens();
  }
}

module.exports = {
  login,
  signup,
  refresh,
  logout,
};
