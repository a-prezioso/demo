"use strict";

// JWT Service implementing HS256 signing and verification without external deps
// Configuration via env:
// - JWT_SECRET (required in production)
// - JWT_PUBLIC_KEY (optional, for RS256 verification)
// - JWT_ISSUER (optional)
// - JWT_AUDIENCE (optional)
// - JWT_ACCESS_EXPIRES_IN (seconds, default 900 = 15 minutes)
// - JWT_REFRESH_EXPIRES_IN (seconds, default 2592000 = 30 days) [used by authService]
// - JWT_CLOCK_SKEW_SEC (seconds, default 0) allowed leeway for iat/nbf/exp checks

const crypto = require("crypto");

function base64url(input) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlToBuffer(str) {
  const s = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
  // pad with '=' to multiple of 4
  const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
  return Buffer.from(s + pad, "base64");
}

function getConfig() {
  const secret = process.env.JWT_SECRET || "dev-insecure-secret"; // DO NOT use default in production
  const publicKey = process.env.JWT_PUBLIC_KEY || null; // PEM for RS256 verify
  const issuer = process.env.JWT_ISSUER || "smartdesk";
  const audience = process.env.JWT_AUDIENCE || "smartdesk-clients";
  const accessExpiresIn = parseInt(process.env.JWT_ACCESS_EXPIRES_IN || "900", 10); // 15m
  const refreshExpiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "2592000", 10); // 30d
  const clockSkew = parseInt(process.env.JWT_CLOCK_SKEW_SEC || "0", 10); // default 0s for backward-compat
  return { secret, publicKey, issuer, audience, accessExpiresIn, refreshExpiresIn, clockSkew };
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
    const { secret, publicKey, issuer, audience, clockSkew } = getConfig();
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return { valid: false, error: "invalid_token" };
    const [headerB64, payloadB64, sigB64] = parts;

    // Parse header and payload
    let header, payload;
    try {
      const headerJson = base64urlToBuffer(headerB64).toString("utf8");
      header = JSON.parse(headerJson);
      const payloadJson = base64urlToBuffer(payloadB64).toString("utf8");
      payload = JSON.parse(payloadJson);
    } catch (_e) {
      return { valid: false, error: "invalid_token" };
    }

    const toSign = `${headerB64}.${payloadB64}`;

    // Verify signature based on alg
    const alg = header && header.alg;
    if (alg === "HS256") {
      const expectedBuf = crypto.createHmac("sha256", Buffer.from(secret)).update(toSign).digest();
      const providedBuf = base64urlToBuffer(sigB64);
      if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
        return { valid: false, error: "invalid_signature" };
      }
    } else if (alg === "RS256") {
      if (!publicKey) return { valid: false, error: "invalid_algorithm" };
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(toSign);
      verifier.end();
      const providedBuf = base64urlToBuffer(sigB64);
      const ok = verifier.verify(publicKey, providedBuf);
      if (!ok) return { valid: false, error: "invalid_signature" };
    } else {
      return { valid: false, error: "invalid_algorithm" };
    }

    // Claims validation
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && now - clockSkew >= payload.exp) {
      return { valid: false, error: "token_expired" };
    }
    if (typeof payload.nbf === "number" && now + clockSkew < payload.nbf) {
      return { valid: false, error: "token_not_yet_valid" };
    }
    if (typeof payload.iat === "number" && payload.iat > now + clockSkew) {
      return { valid: false, error: "invalid_iat" };
    }

    // Issuer / Audience checks (if present in token, must match configured)
    if (payload.iss && issuer && payload.iss !== issuer) {
      return { valid: false, error: "invalid_issuer" };
    }
    if (payload.aud && audience) {
      if (Array.isArray(payload.aud)) {
        if (!payload.aud.includes(audience)) return { valid: false, error: "invalid_audience" };
      } else if (payload.aud !== audience) {
        return { valid: false, error: "invalid_audience" };
      }
    }

    return { valid: true, payload };
  } catch (_err) {
    return { valid: false, error: "invalid_token" };
  }
}

module.exports = {
  sign,
  verify,
  _base64url: base64url,
  _getConfig: getConfig,
  _base64urlToBuffer: base64urlToBuffer,
};
