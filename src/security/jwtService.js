"use strict";

// JWT Service implementing HS256 signing and verification without external deps
// Configuration via env:
// - JWT_SECRET (required in production)
// - JWT_ISSUER (optional)
// - JWT_AUDIENCE (optional)
// - JWT_ACCESS_EXPIRES_IN (seconds, default 900 = 15 minutes)
// - JWT_REFRESH_EXPIRES_IN (seconds, default 2592000 = 30 days) [used by authService]

const crypto = require("crypto");

function base64url(input) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getConfig() {
  const secret = process.env.JWT_SECRET || "dev-insecure-secret"; // DO NOT use default in production
  const issuer = process.env.JWT_ISSUER || "smartdesk";
  const audience = process.env.JWT_AUDIENCE || "smartdesk-clients";
  const accessExpiresIn = parseInt(process.env.JWT_ACCESS_EXPIRES_IN || "900", 10); // 15m
  const refreshExpiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "2592000", 10); // 30d
  return { secret, issuer, audience, accessExpiresIn, refreshExpiresIn };
}

function sign(payload, { expiresInSeconds } = {}) {
  const { secret, issuer, audience, accessExpiresIn } = getConfig();
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (Number.isFinite(expiresInSeconds) ? expiresInSeconds : accessExpiresIn);
  const fullPayload = { ...payload, iss: issuer, aud: audience, iat, exp };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(fullPayload));
  const toSign = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", Buffer.from(secret)).update(toSign).digest();
  const sigB64 = base64url(sig);
  return { token: `${toSign}.${sigB64}`, expiresIn: exp - iat };
}

function verify(token) {
  try {
    const { secret } = getConfig();
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return { valid: false, error: "invalid_token" };
    const [headerB64, payloadB64, sigB64] = parts;
    const toSign = `${headerB64}.${payloadB64}`;
    const expected = base64url(crypto.createHmac("sha256", Buffer.from(secret)).update(toSign).digest());
    const a = Buffer.from(sigB64);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, error: "invalid_signature" };
    }
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) return { valid: false, error: "token_expired" };
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "invalid_token" };
  }
}

module.exports = {
  sign,
  verify,
  _base64url: base64url,
  _getConfig: getConfig,
};
