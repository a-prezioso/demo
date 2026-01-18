"use strict";

// Repository for auth_refresh_tokens persistence and revocation
// - Stores only token hashes (never the raw token)
// - Provides helpers for CRUD-like operations and cleanup

const crypto = require("crypto");
const db = require("../../db");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getExpiresAt(ttlSec) {
  const now = Date.now();
  return new Date(now + Math.max(1, parseInt(ttlSec || 2592000, 10)) * 1000); // default 30d
}

async function createSession({ userId, token, ttlSec, userAgent, ip }) {
  const tokenHash = hashToken(token);
  const expiresAt = getExpiresAt(ttlSec);
  const sql = `
    INSERT INTO auth_refresh_tokens (user_id, token_hash, issued_at, expires_at, user_agent, ip_address)
    VALUES ($1, $2, now(), $3, $4, $5)
    RETURNING id
  `;
  const { rows } = await db.query(sql, [userId, tokenHash, expiresAt, userAgent || null, ip || null]);
  return rows[0] ? rows[0].id : null;
}

async function findSessionWithUserByHash(tokenHash) {
  const sql = `
    SELECT t.id AS session_id, t.user_id, t.expires_at, t.revoked_at, t.last_used_at,
           u.email, u.status, u.roles
      FROM auth_refresh_tokens t
      JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1
     LIMIT 1
  `;
  const { rows } = await db.query(sql, [tokenHash]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await db.query(`SELECT * FROM auth_refresh_tokens WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function listActiveByUser(userId) {
  const { rows } = await db.query(
    `SELECT * FROM auth_refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now() ORDER BY issued_at DESC`,
    [userId]
  );
  return rows;
}

async function touchLastUsed(sessionId) {
  await db.query(`UPDATE auth_refresh_tokens SET last_used_at = now() WHERE id = $1`, [sessionId]);
}

async function revokeById(sessionId, reason) {
  const { rowCount } = await db.query(
    `UPDATE auth_refresh_tokens SET revoked_at = now(), revoked_reason = $2 WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId, reason || null]
  );
  return rowCount > 0;
}

async function revokeByTokenHash(tokenHash, reason) {
  const { rowCount } = await db.query(
    `UPDATE auth_refresh_tokens SET revoked_at = now(), revoked_reason = $2 WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash, reason || null]
  );
  return rowCount > 0;
}

async function revokeAllForUser(userId, reason) {
  await db.query(
    `UPDATE auth_refresh_tokens SET revoked_at = now(), revoked_reason = $2 WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason || null]
  );
  return true;
}

// Cleanup strategy:
// - Remove all expired sessions (expires_at < now())
// - Optionally remove revoked sessions older than retentionDays
async function cleanupExpired({ retentionDays = 30 } = {}) {
  // Delete expired tokens
  await db.query(`DELETE FROM auth_refresh_tokens WHERE expires_at < now()`);
  // Delete revoked tokens older than retention period
  const interval = `${Math.max(0, parseInt(retentionDays, 10))} days`;
  await db.query(`DELETE FROM auth_refresh_tokens WHERE revoked_at IS NOT NULL AND revoked_at < (now() - $1::interval)`, [interval]);
}

module.exports = {
  hashToken,
  createSession,
  findSessionWithUserByHash,
  findById,
  listActiveByUser,
  touchLastUsed,
  revokeById,
  revokeByTokenHash,
  revokeAllForUser,
  cleanupExpired,
};
