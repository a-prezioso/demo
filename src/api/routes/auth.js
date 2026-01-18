"use strict";

const express = require("express");
const router = express.Router();

const { passwordService, validationService } = require("../../security");
const db = require("../../db");
const { login } = require("../services/authService");

// Helper to safely send error responses
function sendBadRequest(res, message) {
  return res.status(400).json({ error: message || "Invalid request" });
}

function nowIso() {
  return new Date().toISOString();
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

module.exports = router;
