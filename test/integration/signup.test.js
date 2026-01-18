"use strict";

// Integration tests for /api/auth/signup using pg-mem (in-memory PostgreSQL)
// No real database required. We mock 'pg' to use pg-mem's adapter so the app
// code under test stays unchanged.

const request = require("supertest");
const { newDb } = require("pg-mem");

// Build a shared in-memory DB and mock 'pg' before importing app modules
const mem = newDb({ autoCreateForeignKeyIndices: true });

// Register minimal functions used by our schema/migration
mem.public.registerFunction({
  name: "now",
  returns: "timestamptz",
  implementation: () => new Date(),
});

// gen_random_uuid used by schema default
mem.public.registerFunction({
  name: "gen_random_uuid",
  returns: "uuid",
  implementation: () => require("crypto").randomUUID(),
});

// Create pg adapter and mock 'pg'
const pgAdapter = mem.adapters.createPg();
jest.mock("pg", () => pgAdapter);

// Set lighter crypto settings to speed up tests
beforeAll(async () => {
  process.env.SECURITY_SCRYPT_N = process.env.SECURITY_SCRYPT_N || "1024";
  process.env.SECURITY_SCRYPT_R = process.env.SECURITY_SCRYPT_R || "8";
  process.env.SECURITY_SCRYPT_P = process.env.SECURITY_SCRYPT_P || "1";

  // Minimal schema reflecting what's used by the API
  mem.public.none(`
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED');

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NULL,
      status user_status NOT NULL DEFAULT 'ACTIVE',
      verification_token TEXT NULL,
      verification_expires_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
  `);
});

// Import app and db after pg is mocked
const { buildApp } = require("../../src/api");
const db = require("../../src/db");
let app;

beforeAll(() => {
  app = buildApp();
});

afterEach(async () => {
  // Cleanup all data between tests
  mem.public.none("TRUNCATE TABLE users");
});

describe("POST /api/auth/signup - integration", () => {
  test("(1) valid signup returns 201 and creates DB record with hashed password", async () => {
    const payload = { email: "user@example.com", password: "Str0ng!Passw0rd" };

    const res = await request(app).post("/api/auth/signup").send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toMatchObject({ email: payload.email, status: "ACTIVE" });

    // Response must not include sensitive fields
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.salt).toBeUndefined();

    // Verify DB record exists and password_hash is not null and different from plain
    const { rows } = await db.query("SELECT email, password_hash FROM users WHERE email=$1", [payload.email]);
    expect(rows.length).toBe(1);
    expect(rows[0].password_hash).toBeTruthy();
    expect(rows[0].password_hash).not.toEqual(payload.password);
  });

  test("(2) duplicate email returns 409 and does not create a new user", async () => {
    const payload = { email: "dup@example.com", password: "An0ther$Strong" };

    const r1 = await request(app).post("/api/auth/signup").send(payload);
    expect(r1.status).toBe(201);

    const r2 = await request(app).post("/api/auth/signup").send(payload);
    expect([409]).toContain(r2.status); // expecting 409 based on duplicate detection

    const { rows } = await db.query("SELECT COUNT(*)::int AS c FROM users WHERE email=$1", [payload.email]);
    expect(rows[0].c).toBe(1);
  });

  test("(3) missing or incomplete payload returns 400", async () => {
    const r1 = await request(app).post("/api/auth/signup").send({});
    expect(r1.status).toBe(400);
    expect(r1.body.error).toMatch(/Email and password are required/);

    const r2 = await request(app).post("/api/auth/signup").send({ email: "a@b.com" });
    expect(r2.status).toBe(400);

    const r3 = await request(app).post("/api/auth/signup").send({ password: "Str0ng!Passw0rd" });
    expect(r3.status).toBe(400);
  });

  test("(4) invalid email or password policy violations return 400", async () => {
    const badEmail = await request(app).post("/api/auth/signup").send({ email: "not-an-email", password: "Str0ng!Passw0rd" });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error).toMatch(/Invalid email/i);

    const badPassword = await request(app).post("/api/auth/signup").send({ email: "ok@example.com", password: "short" });
    expect(badPassword.status).toBe(400);
    expect(badPassword.body.error).toMatch(/Password/i);
  });

  test("(5) response does not contain sensitive fields", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "sec@example.com", password: "Str0ng!Passw0rd" });
    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.salt).toBeUndefined();
  });

  test("(6) DB error simulated returns 500", async () => {
    // Simulate one-time DB failure on insert
    const spy = jest.spyOn(db, "query").mockRejectedValueOnce(new Error("db failure"));

    const res = await request(app).post("/api/auth/signup").send({ email: "err@example.com", password: "Str0ng!Passw0rd" });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Internal server error/);

    spy.mockRestore();
  });
});
