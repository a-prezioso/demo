"use strict";

// Unit tests for authService login/refresh logic focusing on credential validation branches
const { newDb } = require("pg-mem");

// Prepare in-memory pg and mock 'pg'
const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: "now", returns: "timestamptz", implementation: () => new Date() });
mem.public.registerFunction({ name: "gen_random_uuid", returns: "uuid", implementation: () => require("crypto").randomUUID() });
const pgAdapter = mem.adapters.createPg();
jest.mock("pg", () => pgAdapter);

// Import modules after mock
const db = require("../../src/db");
const { passwordService } = require("../../src/security");
const { login, refresh } = require("../../src/api/services/authService");

beforeAll(async () => {
  process.env.SECURITY_SCRYPT_N = process.env.SECURITY_SCRYPT_N || "1024";
  process.env.SECURITY_SCRYPT_R = process.env.SECURITY_SCRYPT_R || "8";
  process.env.SECURITY_SCRYPT_P = process.env.SECURITY_SCRYPT_P || "1";

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

afterEach(() => {
  mem.public.none("TRUNCATE TABLE auth_refresh_tokens");
  mem.public.none("TRUNCATE TABLE users");
});

async function createUser({ email, password, status = 'ACTIVE', roles = ['USER'] }) {
  const hash = await passwordService.hashPassword(password);
  await db.query(
    `INSERT INTO users (email, password_hash, status, roles) VALUES ($1,$2,$3,$4)`,
    [email, hash, status, roles]
  );
}

describe("authService.login - unit", () => {
  test("success login returns tokens and user info", async () => {
    const email = "ok@example.com";
    await createUser({ email, password: "Str0ng!Passw0rd" });

    const res = await login({ email, password: "Str0ng!Passw0rd", userAgent: "jest", ip: "127.0.0.1" });
    expect(res.ok).toBe(true);
    expect(res.code).toBe(200);
    expect(res.data).toHaveProperty("accessToken");
    expect(res.data).toHaveProperty("refreshToken");
    expect(res.data.user.email).toBe(email);
  });

  test("invalid email format -> 400", async () => {
    const res = await login({ email: "bad", password: "x" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe(400);
  });

  test("missing password -> 400", async () => {
    const res = await login({ email: "u@example.com", password: "" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe(400);
  });

  test("user not found -> 401 (no enumeration)", async () => {
    const res = await login({ email: "nofound@example.com", password: "Str0ng!Passw0rd" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe(401);
  });

  test("wrong password -> 401", async () => {
    const email = "u2@example.com";
    await createUser({ email, password: "Str0ng!Passw0rd" });
    const res = await login({ email, password: "WrongPass1!" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe(401);
  });

  test("account pending -> 403", async () => {
    const email = "pending@example.com";
    await createUser({ email, password: "Str0ng!Passw0rd", status: "PENDING" });
    const res = await login({ email, password: "Str0ng!Passw0rd" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe(403);
  });

  test("account disabled -> 423", async () => {
    const email = "disabled@example.com";
    await createUser({ email, password: "Str0ng!Passw0rd", status: "DISABLED" });
    const res = await login({ email, password: "Str0ng!Passw0rd" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe(423);
  });
});

describe("authService.refresh - unit", () => {
  test("invalid token -> 401", async () => {
    const res = await refresh({ refreshToken: "short" });
    expect(res.ok).toBe(false);
    expect(res.code).toBe(401);
  });
});
