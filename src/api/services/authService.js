"use strict";

// Auth service: login and refresh handling

const crypto = require("crypto");
const db = require("../../db");
const { passwordService, validationService, jwtService } = require("../../security");

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

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createRefreshSession(userId, token, { userAgent, ip } = {}) {
  const { refreshTtlSec } = getCfg();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + refreshTtlSec * 1000);
  const tokenHash = hashToken(token);

  const sql = `
    INSERT INTO auth_refresh_tokens (user_id, token_hash, issued_at, expires_at, user_agent, ip_address)
    VALUES ($1, $2, now(), $3, $4, $5)
    RETURNING id
  `;
  await db.query(sql, [userId, tokenHash, expiresAt, userAgent || null, ip || null]);
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

module.exports = {
  login,
};
