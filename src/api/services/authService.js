"use strict";

// Auth service: login and refresh handling

const crypto = require("crypto");
const db = require("../../db");
const { passwordService, validationService, jwtService } = require("../../security");
const refreshRepo = require("../repositories/refreshTokenRepository");

function getCfg() {
  const refreshTtlSec = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "2592000", 10); // 30d
  return { refreshTtlSec };
}

function toBase64Url(b) {
  return Buffer.from(b)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function randomToken(bytes = 32) {
  const raw = crypto.randomBytes(bytes);
  return toBase64Url(raw);
}

async function createRefreshSession(userId, token, { userAgent, ip } = {}) {
  const { refreshTtlSec } = getCfg();
  await refreshRepo.createSession({ userId, token, ttlSec: refreshTtlSec, userAgent, ip });
}

async function login({ email, password, userAgent, ip }) {
  // Validate inputs
  const emailRes = validationService.validateEmail(email);
  if (!emailRes.valid) return { ok: false, code: 400, error: emailRes.error || "Invalid email" };
  if (typeof password !== "string" || password.length < 1) return { ok: false, code: 400, error: "Password is required" };
  const normalizedEmail = emailRes.email;

  // Fetch user by email
  let user;
  try {
    const { rows } = await db.query(
      `SELECT id, email, password_hash, status, roles FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );
    user = rows[0];
  } catch (err) {
    return { ok: false, code: 500, error: "Internal server error" };
  }

  // Default invalid response to avoid user enumeration
  const invalidCreds = { ok: false, code: 401, error: "Invalid credentials" };

  if (!user) {
    // fake verify delay to align timing slightly
    await passwordService.verifyPassword("", "scrypt$N=16384,r=8,p=1,keylen=64$AAAA$AAAA").catch(() => false);
    return invalidCreds;
  }

  // Verify password
  const isValid = await passwordService.verifyPassword(password, user.password_hash);
  if (!isValid) return invalidCreds;

  // Check status
  if (user.status === "PENDING") return { ok: false, code: 403, error: "Please verify your email" };
  if (user.status === "SUSPENDED" || user.status === "DISABLED") return { ok: false, code: 423, error: "Account is locked" };

  // Update last_login_at (best effort)
  try {
    await db.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
  } catch (_e) {
    // ignore
  }

  // Generate access token
  const payload = { sub: user.id, email: user.email, roles: user.roles || ["USER"] };
  const { token: accessToken, expiresIn } = jwtService.sign(payload);

  // Generate refresh token and persist session
  const refreshToken = randomToken(48);
  try {
    await createRefreshSession(user.id, refreshToken, { userAgent, ip });
  } catch (err) {
    return { ok: false, code: 500, error: "Internal server error" };
  }

  return {
    ok: true,
    code: 200,
    data: {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn,
      user: { id: user.id, email: user.email, roles: user.roles || ["USER"] },
    },
  };
}

async function refresh({ refreshToken, userAgent, ip, rotate = true }) {
  // Validate input
  if (typeof refreshToken !== "string" || refreshToken.length < 10) {
    return { ok: false, code: 401, error: "Invalid refresh token" };
  }

  const tokenHash = refreshRepo.hashToken(refreshToken);

  // Lookup session and user
  let row;
  try {
    row = await refreshRepo.findSessionWithUserByHash(tokenHash);
  } catch (_e) {
    return { ok: false, code: 500, error: "Internal server error" };
  }

  const invalid = { ok: false, code: 401, error: "Invalid refresh token" };
  if (!row) return invalid;

  // Check revoked or expired
  const now = new Date();
  if (row.revoked_at) return invalid;
  if (row.expires_at && new Date(row.expires_at) <= now) return invalid;

  // Check user status
  if (row.status === "SUSPENDED" || row.status === "DISABLED") return { ok: false, code: 423, error: "Account is locked" };
  if (row.status === "PENDING") return { ok: false, code: 403, error: "Please verify your email" };

  const userId = row.user_id;
  const userRoles = row.roles || ["USER"];

  // Issue new access token
  const payload = { sub: userId, email: row.email, roles: userRoles };
  const { token: accessToken, expiresIn } = jwtService.sign(payload);

  // Rotate refresh token by default for better security
  if (rotate) {
    const newRefresh = randomToken(48);
    const clientUA = userAgent || null;
    const clientIp = ip || null;
    try {
      await refreshRepo.revokeById(row.session_id, "rotated");
      await createRefreshSession(userId, newRefresh, { userAgent: clientUA, ip: clientIp });
    } catch (err) {
      return { ok: false, code: 500, error: "Internal server error" };
    }

    return {
      ok: true,
      code: 200,
      data: { accessToken, refreshToken: newRefresh, tokenType: "Bearer", expiresIn },
    };
  }

  // No rotation: update last_used_at best-effort
  try {
    await refreshRepo.touchLastUsed(row.session_id);
  } catch (_e) {
    // ignore
  }

  return { ok: true, code: 200, data: { accessToken, refreshToken, tokenType: "Bearer", expiresIn } };
}

async function revokeByToken(refreshToken) {
  if (typeof refreshToken !== "string" || refreshToken.length < 10) return false;
  const tokenHash = refreshRepo.hashToken(refreshToken);
  try {
    const ok = await refreshRepo.revokeByTokenHash(tokenHash, "logout");
    return ok;
  } catch (_e) {
    return false;
  }
}

async function revokeAllForUser(userId) {
  if (!userId) return false;
  try {
    await refreshRepo.revokeAllForUser(userId, "logout_all");
    return true;
  } catch (_e) {
    return false;
  }
}

async function logout({ refreshToken, accessToken, allSessions } = {}) {
  // Logout should not leak whether a token existed; respond as success regardless
  // If refreshToken provided -> revoke that one
  if (typeof refreshToken === "string" && refreshToken.length > 0) {
    await revokeByToken(refreshToken);
    return { ok: true, code: 204 };
  }

  // If request wants to revoke all sessions for the authenticated user, try to verify access token
  if (allSessions === true && typeof accessToken === "string" && accessToken.length > 10) {
    const ver = jwtService.verify(accessToken);
    if (ver && ver.valid && ver.payload && ver.payload.sub) {
      await revokeAllForUser(ver.payload.sub);
      return { ok: true, code: 204 };
    }
  }

  // Bad request if neither provided
  return { ok: false, code: 400, error: "Invalid request" };
}

module.exports = {
  login,
  refresh,
  logout,
};
