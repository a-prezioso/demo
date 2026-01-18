"use strict";

// Integration tests for /api/auth/refresh and protected endpoints
const request = require("supertest");
const { newDb } = require("pg-mem");
const crypto = require("crypto");

// Build in-memory DB and mock pg
const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: "now", returns: "timestamptz", implementation: () => new Date() });
mem.public.registerFunction({ name: "gen_random_uuid", returns: "uuid", implementation: () => require("crypto").randomUUID() });
const pgAdapter = mem.adapters.createPg();
jest.mock("pg", () => pgAdapter);

beforeAll(() => {
  process.env.SECURITY_SCRYPT_N = process.env.SECURITY_SCRYPT_N || "1024";
  process.env.SECURITY_SCRYPT_R = process.env.SECURITY_SCRYPT_R || "8";
  process.env.SECURITY_SCRYPT_P = process.env.SECURITY_SCRYPT_P || "1";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "itest-secret";
});

// Schema for auth
beforeAll(() => {
  mem.public.none(`
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED');
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      status user_status NOT NULL DEFAULT 'ACTIVE',
      roles TEXT[] NOT NULL DEFAULT ARRAY['USER'],
      last_login_at TIMESTAMPTZ NULL
    );
    CREATE TABLE auth_refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      token_hash TEXT NOT NULL,
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

const { buildApp } = require("../../src/api");
const db = require("../../src/db");
const { passwordService } = require("../../src/security");
let app;

beforeAll(() => { app = buildApp(); });

afterEach(() => {
  mem.public.none("TRUNCATE TABLE auth_refresh_tokens");
  mem.public.none("TRUNCATE TABLE users");
});

async function seedUser({ email, password, status = 'ACTIVE', roles = ['USER'] }) {
  const hash = await passwordService.hashPassword(password);
  await db.query(`INSERT INTO users (email, password_hash, status, roles) VALUES ($1,$2,$3,$4)`, [email, hash, status, roles]);
}

async function getUserId(email) {
  const { rows } = await db.query("SELECT id FROM users WHERE email=$1", [email]);
  return rows[0] && rows[0].id;
}

describe("Protected endpoints without/with token", () => {
  test("GET /api/private/me 401 without token and 200 with token", async () => {
    const email = "p@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    const token = loginRes.body.accessToken;

    const r1 = await request(app).get("/api/private/me");
    expect(r1.status).toBe(401);

    const r2 = await request(app).get("/api/private/me").set("Authorization", `Bearer ${token}`);
    expect(r2.status).toBe(200);
    expect(r2.body.user.email).toBe(email);
  });
});

describe("/api/auth/refresh behavior", () => {
  test("valid refresh returns new access and rotates refresh (old invalid)", async () => {
    const email = "rot@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    const oldRefresh = loginRes.body.refreshToken;

    const r1 = await request(app).post("/api/auth/refresh").send({ refreshToken: oldRefresh });
    expect(r1.status).toBe(200);
    expect(r1.body.refreshToken).toBeDefined();
    expect(r1.body.refreshToken).not.toBe(oldRefresh);

    // Old should now be invalid
    const r2 = await request(app).post("/api/auth/refresh").send({ refreshToken: oldRefresh });
    expect(r2.status).toBe(401);
  });

  test("expired refresh token session -> 401", async () => {
    const email = "exp@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const userId = await getUserId(email);
    const token = "manual-refresh-token";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const past = new Date(Date.now() - 60 * 1000);

    await db.query(
      `INSERT INTO auth_refresh_tokens (user_id, token_hash, issued_at, expires_at) VALUES ($1,$2,$3,$4)`,
      [userId, tokenHash, new Date(Date.now() - 120 * 1000), past]
    );

    const r = await request(app).post("/api/auth/refresh").send({ refreshToken: token });
    expect(r.status).toBe(401);
  });

  test("revoked refresh token via logout -> 401 on reuse", async () => {
    const email = "rev@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    const token = loginRes.body.refreshToken;

    const logoutRes = await request(app).post("/api/auth/logout").send({ refreshToken: token });
    expect([204, 200]).toContain(logoutRes.status);

    const r = await request(app).post("/api/auth/refresh").send({ refreshToken: token });
    expect(r.status).toBe(401);
  });

  test("no rotation (rotate=false) returns same refresh and touch last_used_at", async () => {
    const email = "norot@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    const refreshToken = loginRes.body.refreshToken;

    const r1 = await request(app).post("/api/auth/refresh").send({ refreshToken, rotate: false });
    expect(r1.status).toBe(200);
    expect(r1.body.refreshToken).toBe(refreshToken);
  });
});
