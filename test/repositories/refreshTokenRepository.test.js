"use strict";

// Unit tests for refreshTokenRepository
const { newDb } = require("pg-mem");

// Setup in-memory pg and mock before importing repository
const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: "now", returns: "timestamptz", implementation: () => new Date() });
mem.public.registerFunction({ name: "gen_random_uuid", returns: "uuid", implementation: () => require("crypto").randomUUID() });
const pgAdapter = mem.adapters.createPg();
jest.mock("pg", () => pgAdapter);

const db = require("../../src/db");
const repo = require("../../src/api/repositories/refreshTokenRepository");

beforeAll(() => {
  mem.public.none(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      roles TEXT[] NOT NULL DEFAULT ARRAY['USER']
    );
    CREATE TABLE auth_refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_used_at TIMESTAMPTZ NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ NULL,
      revoked_reason TEXT NULL,
      user_agent TEXT NULL,
      ip_address TEXT NULL
    );
  `);
});

afterEach(() => {
  mem.public.none("TRUNCATE TABLE auth_refresh_tokens");
  mem.public.none("TRUNCATE TABLE users");
});

async function seedUser(email = "u@example.com") {
  const { rows } = await db.query(`INSERT INTO users (email) VALUES ($1) RETURNING id`, [email]);
  return rows[0].id;
}

describe("refreshTokenRepository", () => {
  test("createSession -> persists hash and returns id", async () => {
    const userId = await seedUser();
    const id = await repo.createSession({ userId, token: "opaque-refresh-token", ttlSec: 60, userAgent: "jest", ip: "127.0.0.1" });
    expect(id).toBeDefined();

    const { rows } = await db.query(`SELECT * FROM auth_refresh_tokens WHERE id=$1`, [id]);
    expect(rows[0]).toBeDefined();
    expect(rows[0].token_hash).toBe(repo.hashToken("opaque-refresh-token"));
  });

  test("findSessionWithUserByHash -> joins user", async () => {
    const userId = await seedUser("join@example.com");
    const token = "tok-123456";
    const id = await repo.createSession({ userId, token, ttlSec: 60 });
    const rec = await repo.findSessionWithUserByHash(repo.hashToken(token));
    expect(rec).toBeDefined();
    expect(rec.user_id).toBe(userId);
    expect(rec.email).toBe("join@example.com");
  });

  test("revokeById and revokeByTokenHash", async () => {
    const userId = await seedUser();
    const token = "tok-revoke";
    const id = await repo.createSession({ userId, token, ttlSec: 60 });

    const ok1 = await repo.revokeById(id, "test");
    expect(ok1).toBe(true);

    const id2 = await repo.createSession({ userId, token: "another", ttlSec: 60 });
    const ok2 = await repo.revokeByTokenHash(repo.hashToken("another"), "test2");
    expect(ok2).toBe(true);
  });

  test("revokeAllForUser and listActiveByUser", async () => {
    const userId = await seedUser();
    await repo.createSession({ userId, token: "a", ttlSec: 600 });
    await repo.createSession({ userId, token: "b", ttlSec: 600 });

    const list = await repo.listActiveByUser(userId);
    expect(list.length).toBe(2);

    await repo.revokeAllForUser(userId, "logout_all");
    const list2 = await repo.listActiveByUser(userId);
    expect(list2.length).toBe(0);
  });

  test("cleanupExpired removes expired and old revoked", async () => {
    const userId = await seedUser();
    // expired session
    await db.query(
      `INSERT INTO auth_refresh_tokens (user_id, token_hash, issued_at, expires_at) VALUES ($1,$2, now() - interval '2 hours', now() - interval '1 hour')`,
      [userId, repo.hashToken("expired")] 
    );
    // revoked old
    await db.query(
      `INSERT INTO auth_refresh_tokens (user_id, token_hash, issued_at, expires_at, revoked_at) VALUES ($1,$2, now() - interval '40 days', now() + interval '10 days', now() - interval '31 days')`,
      [userId, repo.hashToken("revoked-old")] 
    );
    // active
    await db.query(
      `INSERT INTO auth_refresh_tokens (user_id, token_hash, issued_at, expires_at) VALUES ($1,$2, now(), now() + interval '10 days')`,
      [userId, repo.hashToken("active")] 
    );

    await repo.cleanupExpired({ retentionDays: 30 });

    const { rows } = await db.query(`SELECT token_hash FROM auth_refresh_tokens ORDER BY issued_at ASC`);
    const hashes = rows.map((r) => r.token_hash);
    expect(hashes).toContain(repo.hashToken("active"));
    expect(hashes).not.toContain(repo.hashToken("expired"));
    expect(hashes).not.toContain(repo.hashToken("revoked-old"));
  });
});
