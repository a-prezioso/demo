/**
 * User repository: persistence functions for users table.
 * - Maps between DB snake_case and app camelCase
 * - Provides create and lookup by email
 */

import { User, UserStatus } from './user.model';
import { query } from '../../db/client';

interface DbUserRow {
  id: string;
  email: string;
  password_hash: string;
  status: string;
  verification_token: string | null;
  verification_expires_at: string | null; // timestamptz -> ISO string
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

function mapRowToUser(row: DbUserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    status: (row.status as UserStatus) || UserStatus.ACTIVE,
    verificationToken: row.verification_token,
    verificationExpiresAt: row.verification_expires_at ? new Date(row.verification_expires_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const sql = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
  const res = await query<DbUserRow>(sql, [email]);
  if (res.rows.length === 0) return null;
  return mapRowToUser(res.rows[0]);
}

interface CreateUserParams {
  email: string;
  passwordHash: string;
  status?: UserStatus;
}

export async function createUser(params: CreateUserParams): Promise<User> {
  const sql = `
    INSERT INTO users (email, password_hash, status)
    VALUES ($1, $2, $3)
    RETURNING id, email, password_hash, status, verification_token, verification_expires_at, created_at, updated_at
  `;
  const res = await query<DbUserRow>(sql, [
    params.email,
    params.passwordHash,
    params.status ?? UserStatus.ACTIVE,
  ]);
  return mapRowToUser(res.rows[0]);
}
