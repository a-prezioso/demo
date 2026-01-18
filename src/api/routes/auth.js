"use strict";

const express = require("express");
const router = express.Router();

const { passwordService, validationService } = require("../../security");
const db = require("../../db");
const { login, refresh, logout } = require("../services/authService");

// Helper to safely send error responses
function sendBadRequest(res, message) {
  return res.status(400).json({ error: message || "Invalid request" });
}

function nowIso() {
  return new Date().toISOString();
}

function getBearerToken(req) {
  const header = req.headers && (req.headers["authorization"] || req.headers["Authorization"]);
  if (!header || typeof header !== "string") return null;
  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (/^Bearer$/i.test(scheme)) return token;
  return null;
}

router.post("/signup", async (req, res) => {
  const startedAt = Date.now();
  try {
    const { email, password } = req.body || {};

    // Input presence
    if (email == null || password == null) {
      return sendBadRequest(res, "Email and password are required");
    }

    // Validate email
    const emailResult = validationService.validateEmail(email);
    if (!emailResult.valid) {
      return sendBadRequest(res, emailResult.error || "Invalid email");
    }

    // Validate password (do not log content)
    const pwdResult = validationService.validatePassword(password);
    if (!pwdResult.valid) {
      return sendBadRequest(res, pwdResult.error || "Invalid password");
    }

    const normalizedEmail = emailResult.email;

    // Hash password (never log password or hash)
    const passwordHash = await passwordService.hashPassword(password);

    // Try insert, rely on DB unique constraint for race-safe uniqueness
    // Only store fields per schema; salt is embedded in hash so not stored separately here
    const insertSql = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, status, created_at, updated_at
    `;

    let inserted;
    try {
      const result = await db.query(insertSql, [normalizedEmail, passwordHash]);
      inserted = result.rows[0];
    } catch (err) {
      // Detect unique violation (PostgreSQL SQLSTATE 23505)
      if (err && err.code === "23505") {
        return res.status(409).json({ error: "Email already registered" });
      }
      // Generic DB error
      console.error(JSON.stringify({ level: "error", msg: "signup db insert error", err: err.message }));
      return res.status(500).json({ error: "Internal server error" });
    }

    // Success
    return res.status(201).json({
      id: inserted.id,
      email: inserted.email,
      status: inserted.status,
      created_at: inserted.created_at,
      updated_at: inserted.updated_at,
    });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "signup unexpected error", err: err.message }));
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    const durationMs = Date.now() - startedAt;
    console.log(JSON.stringify({ level: "info", msg: "signup_request", duration_ms: durationMs, at: nowIso() }));
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  const startedAt = Date.now();
  try {
    const { email, password } = req.body || {};
    if (email == null || password == null) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const ua = req.headers["user-agent"] || null;
    const ip = req.ip || req.connection?.remoteAddress || null;

    const result = await login({ email, password, userAgent: ua, ip });
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }

    return res.status(200).json(result.data);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "login unexpected error", err: err.message }));
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    const durationMs = Date.now() - startedAt;
    console.log(JSON.stringify({ level: "info", msg: "login_request", duration_ms: durationMs, at: nowIso() }));
  }
});

// Refresh endpoint
router.post("/refresh", async (req, res) => {
  const startedAt = Date.now();
  try {
    const { refreshToken, rotate } = req.body || {};
    const ua = req.headers["user-agent"] || null;
    const ip = req.ip || req.connection?.remoteAddress || null;

    const result = await refresh({ refreshToken, userAgent: ua, ip, rotate: rotate !== false });
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "refresh unexpected error", err: err.message }));
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    const durationMs = Date.now() - startedAt;
    console.log(JSON.stringify({ level: "info", msg: "refresh_request", duration_ms: durationMs, at: nowIso() }));
  }
});

// Logout / revoke endpoint
router.post("/logout", async (req, res) => {
  const startedAt = Date.now();
  try {
    const { refreshToken, allSessions } = req.body || {};
    const bearer = getBearerToken(req);

    const result = await logout({ refreshToken, accessToken: bearer, allSessions: allSessions === true });
    if (!result.ok) {
      return res.status(result.code).json({ error: result.error });
    }

    return res.status(result.code).send();
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "logout unexpected error", err: err.message }));
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    const durationMs = Date.now() - startedAt;
    console.log(JSON.stringify({ level: "info", msg: "logout_request", duration_ms: durationMs, at: nowIso() }));
  }
});

module.exports = router;
