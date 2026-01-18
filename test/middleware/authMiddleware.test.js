"use strict";

// Unit-like tests for JWT middleware using a minimal Express app
const express = require("express");
const request = require("supertest");

const { requireAuth, requireRoles } = require("../../src/api/middleware/auth");
const { jwtService } = require("../../src/security");

function buildApp() {
  const app = express();
  app.get("/protected", requireAuth(), (req, res) => {
    return res.status(200).json({ ok: true, user: { id: req.user.id, email: req.user.email, roles: req.user.roles } });
  });
  app.get("/admin", requireAuth({ roles: ["ADMIN"] }), requireRoles(["ADMIN"]), (req, res) => {
    return res.status(200).json({ ok: true });
  });
  return app;
}

function tamperSignature(token) {
  const parts = token.split(".");
  const sig = parts[2] || "";
  if (!sig) return token + "x";
  const last = sig.slice(-1);
  parts[2] = sig.slice(0, -1) + (last === "a" ? "b" : "a");
  return parts.join(".");
}

let app;

beforeEach(() => {
  // Set deterministic env for each test
  process.env.JWT_SECRET = "unit-secret";
  process.env.JWT_ISSUER = "unit-issuer";
  process.env.JWT_AUDIENCE = "unit-audience";
  app = buildApp();
});

describe("requireAuth middleware", () => {
  test("allows access with valid token and exposes user/roles", async () => {
    const { token } = jwtService.sign({ sub: "u1", email: "user@example.com", roles: ["USER"] });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe("u1");
    expect(res.body.user.email).toBe("user@example.com");
    expect(Array.isArray(res.body.user.roles)).toBe(true);
    expect(res.body.user.roles).toContain("USER");
  });

  test("401 when token is missing", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  test("401 when signature is invalid", async () => {
    const { token } = jwtService.sign({ sub: "u1", email: "user@example.com", roles: ["USER"] });
    const bad = tamperSignature(token);
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${bad}`);
    expect(res.status).toBe(401);
  });

  test("401 when token expired", async () => {
    const { token } = jwtService.sign({ sub: "u1" }, { expiresInSeconds: -10 });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test("401 when issuer is wrong", async () => {
    // Sign with issuer A
    process.env.JWT_ISSUER = "issuer-A";
    const token = jwtService.sign({ sub: "u1" }).token;
    // Verify with issuer B
    process.env.JWT_ISSUER = "issuer-B";
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test("401 when audience is wrong", async () => {
    // Sign with audience A
    process.env.JWT_AUDIENCE = "aud-A";
    const token = jwtService.sign({ sub: "u1" }).token;
    // Verify with audience B
    process.env.JWT_AUDIENCE = "aud-B";
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test("403 for missing role on admin route and 200 when role present", async () => {
    const userToken = jwtService.sign({ sub: "u1", email: "u@e.com", roles: ["USER"] }).token;
    const adminToken = jwtService.sign({ sub: "a1", email: "a@e.com", roles: ["ADMIN"] }).token;

    const r1 = await request(app).get("/admin").set("Authorization", `Bearer ${userToken}`);
    expect(r1.status).toBe(403);

    const r2 = await request(app).get("/admin").set("Authorization", `Bearer ${adminToken}`);
    expect(r2.status).toBe(200);
  });
});
