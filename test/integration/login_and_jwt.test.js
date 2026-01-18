"use strict";

// Integration tests for /api/auth/login and JWT guard routes
const request = require("supertest");
const { newDb } = require("pg-mem");
const crypto = require("crypto");

// Build in-memory DB and mock pg
const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: "now", returns: "timestamptz", implementation: () => new Date() });
mem.public.registerFunction({ name: "gen_random_uuid", returns: "uuid", implementation: () => require("crypto").randomUUID() });
const pgAdapter = mem.adapters.createPg();
jest.mock("pg", () => pgAdapter);

// Reduce crypto cost for speed
beforeAll(() => {
  process.env.SECURITY_SCRYPT_N = process.env.SECURITY_SCRYPT_N || "1024";
  process.env.SECURITY_SCRYPT_R = process.env.SECURITY_SCRYPT_R || "8";
  process.env.SECURITY_SCRYPT_P = process.env.SECURITY_SCRYPT_P || "1";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "itest-secret";
});

// Schema reflecting what's needed for login/refresh and roles
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
const { passwordService, jwtService } = require("../../src/security");
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

describe("POST /api/auth/login - integration", () => {
  test("success -> 200 returns tokens and user", async () => {
    const email = "login@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd", roles: ["USER"] });
    const res = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("expiresIn");
    expect(res.body).toHaveProperty("tokenType", "Bearer");
  });

  test("wrong password -> 401", async () => {
    const email = "login2@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const res = await request(app).post("/api/auth/login").send({ email, password: "Wrong1!" });
    expect(res.status).toBe(401);
  });

  test("missing inputs -> 400", async () => {
    const r1 = await request(app).post("/api/auth/login").send({ email: "a@b.com" });
    expect(r1.status).toBe(400);
  });

  test("email not found -> 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "no@example.com", password: "Str0ng!Passw0rd" });
    expect(res.status).toBe(401);
  });

  test("account locked -> 423 and pending -> 403", async () => {
    const e1 = "dis@example.com";
    const e2 = "pending@example.com";
    await seedUser({ email: e1, password: "Str0ng!Passw0rd", status: "DISABLED" });
    await seedUser({ email: e2, password: "Str0ng!Passw0rd", status: "PENDING" });

    const r1 = await request(app).post("/api/auth/login").send({ email: e1, password: "Str0ng!Passw0rd" });
    expect(r1.status).toBe(423);
    const r2 = await request(app).post("/api/auth/login").send({ email: e2, password: "Str0ng!Passw0rd" });
    expect(r2.status).toBe(403);
  });
});

describe("JWT middleware/guard - integration", () => {
  test("access protected route with valid token -> 200", async () => {
    const email = "guard@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    const token = loginRes.body.accessToken;

    const r = await request(app).get("/api/secure/profile").set("Authorization", `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body.user.email).toBe(email);
  });

  test("admin only route -> 403 for USER and 200 for ADMIN", async () => {
    const emailUser = "user@example.com";
    const emailAdmin = "admin@example.com";
    await seedUser({ email: emailUser, password: "Str0ng!Passw0rd", roles: ["USER"] });
    await seedUser({ email: emailAdmin, password: "Str0ng!Passw0rd", roles: ["ADMIN"] });

    const loginUser = await request(app).post("/api/auth/login").send({ email: emailUser, password: "Str0ng!Passw0rd" });
    const loginAdmin = await request(app).post("/api/auth/login").send({ email: emailAdmin, password: "Str0ng!Passw0rd" });

    const rUser = await request(app).get("/api/secure/admin/metrics").set("Authorization", `Bearer ${loginUser.body.accessToken}`);
    expect(rUser.status).toBe(403);

    const rAdmin = await request(app).get("/api/secure/admin/metrics").set("Authorization", `Bearer ${loginAdmin.body.accessToken}`);
    expect(rAdmin.status).toBe(200);
  });

  test("missing token -> 401", async () => {
    const r = await request(app).get("/api/secure/profile");
    expect(r.status).toBe(401);
  });

  test("expired token -> 401", async () => {
    const token = jwtService.sign({ sub: "x", email: "e@x.com", roles: ["USER"] }, { expiresInSeconds: -1 }).token;
    const r = await request(app).get("/api/secure/profile").set("Authorization", `Bearer ${token}`);
    expect(r.status).toBe(401);
  });

  test("invalid signature -> 401", async () => {
    const token = jwtService.sign({ sub: "x", email: "e@x.com", roles: ["USER"] }).token;
    const parts = token.split(".");
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === "a" ? "b" : "a");
    const bad = parts.join(".");

    const r = await request(app).get("/api/secure/profile").set("Authorization", `Bearer ${bad}`);
    expect(r.status).toBe(401);
  });
});

describe("/api/auth/refresh - integration", () => {
  test("refresh valid -> 200 returns new access and refresh", async () => {
    const email = "refresh@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    const oldRefresh = loginRes.body.refreshToken;

    const r = await request(app).post("/api/auth/refresh").send({ refreshToken: oldRefresh });
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty("accessToken");
    expect(r.body).toHaveProperty("refreshToken");
    expect(r.body.refreshToken).not.toBe(oldRefresh); // rotated by default
  });

  test("refresh with invalid token -> 401", async () => {
    const r = await request(app).post("/api/auth/refresh").send({ refreshToken: "invalid" });
    expect(r.status).toBe(401);
  });

  test("refresh revoked via logout -> 401", async () => {
    const email = "revoke@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: "Str0ng!Passw0rd" });
    const oldRefresh = loginRes.body.refreshToken;

    const logoutRes = await request(app).post("/api/auth/logout").send({ refreshToken: oldRefresh });
    expect([204, 200]).toContain(logoutRes.status);

    const r = await request(app).post("/api/auth/refresh").send({ refreshToken: oldRefresh });
    expect(r.status).toBe(401);
  });

  test("refresh expired session -> 401", async () => {
    const email = "expired@example.com";
    await seedUser({ email, password: "Str0ng!Passw0rd" });
    const userId = await getUserId(email);
    const token = "expired-token-value-123456";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const past = new Date(Date.now() - 60 * 1000);

    await db.query(
      `INSERT INTO auth_refresh_tokens (user_id, token_hash, issued_at, expires_at) VALUES ($1,$2,$3,$4)`,
      [userId, tokenHash, new Date(Date.now() - 120 * 1000), past]
    );

    const r = await request(app).post("/api/auth/refresh").send({ refreshToken: token });
    expect(r.status).toBe(401);
  });
});
