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
