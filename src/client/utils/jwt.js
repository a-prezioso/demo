"use strict";

// Minimal JWT utilities for client-side decoding only
// - Decoding is NOT verification: do not trust fields beyond simple UX/state purposes
// - Used to hydrate user state from access token payload

function base64urlDecode(input) {
  try {
    const s = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
    const decoded = Buffer.from(s + pad, "base64").toString("utf8");
    return decoded;
  } catch (_e) {
    return null;
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = base64urlDecode(parts[1]);
    if (!json) return null;
    return JSON.parse(json);
  } catch (_e) {
    return null;
  }
}

function isJwtExpired(token, leewaySec = 10) {
  const p = decodeJwtPayload(token);
  if (!p || !p.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= (p.exp - Math.max(0, leewaySec));
}

module.exports = {
  decodeJwtPayload,
  isJwtExpired,
};
