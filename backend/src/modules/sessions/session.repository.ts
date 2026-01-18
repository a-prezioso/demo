/**
 * User sessions repository for storing refresh token hashes.
 * Table: user_sessions
 */

import { query } from '../../db/client';

export interface CreateUserSessionParams {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

interface DbSessionRow {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface UserSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
}

function mapRow(row: DbSessionRow): UserSession {
  return {
    id: row.id,
    userId: row.user_id,
    refreshTokenHash: row.refresh_token_hash,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  };
}

export async function createUserSession(params: CreateUserSessionParams): Promise<UserSession> {
  const sql = `
    INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, refresh_token_hash, user_agent, ip_address, created_at, expires_at, revoked_at
  `;
  const res = await query<DbSessionRow>(sql, [
    params.userId,
    params.refreshTokenHash,
    params.userAgent ?? null,
    params.ipAddress ?? null,
    params.expiresAt.toISOString(),
  ]);
  return mapRow(res.rows[0]);
}

export async function findActiveSessionByHash(refreshTokenHash: string): Promise<UserSession | null> {
  const sql = `
    SELECT id, user_id, refresh_token_hash, user_agent, ip_address, created_at, expires_at, revoked_at
    FROM user_sessions
    WHERE refresh_token_hash = $1
      AND revoked_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;
  const res = await query<DbSessionRow>(sql, [refreshTokenHash]);
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function rotateSessionToken(
  sessionId: string,
  newRefreshTokenHash: string,
  newExpiresAt: Date,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<UserSession> {
  const sql = `
    UPDATE user_sessions
    SET refresh_token_hash = $2,
        user_agent = COALESCE($3, user_agent),
        ip_address = COALESCE($4, ip_address),
        expires_at = $5,
        revoked_at = NULL
    WHERE id = $1
    RETURNING id, user_id, refresh_token_hash, user_agent, ip_address, created_at, expires_at, revoked_at
  `;
  const res = await query<DbSessionRow>(sql, [
    sessionId,
    newRefreshTokenHash,
    meta?.userAgent ?? null,
    meta?.ipAddress ?? null,
    newExpiresAt.toISOString(),
  ]);
  return mapRow(res.rows[0]);
}

export async function revokeSessionById(sessionId: string): Promise<void> {
  const sql = `
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE id = $1 AND revoked_at IS NULL
  `;
  await query(sql, [sessionId]);
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  const sql = `
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE user_id = $1 AND revoked_at IS NULL
  `;
  await query(sql, [userId]);
}
