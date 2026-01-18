"use strict";

const { jwtService } = require("../../src/security");
const crypto = require("crypto");

function tamperToken(token) {
  // Flip last char of signature to break HMAC
  const parts = token.split(".");
  const sig = parts[2] || "";
  if (!sig) return token + "x";
  const last = sig.slice(-1);
  const flipped = last === "a" ? "b" : "a";
  parts[2] = sig.slice(0, -1) + flipped;
  return parts.join(".");
}

describe("jwtService", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    process.env.JWT_ISSUER = "jest-issuer";
    process.env.JWT_AUDIENCE = "jest-aud";
  });

  test("sign returns a JWT and verify succeeds with payload and exp", () => {
    const { token, expiresIn } = jwtService.sign({ sub: "123", email: "u@example.com", roles: ["USER"] });
    expect(typeof token).toBe("string");
    expect(expiresIn).toBeGreaterThan(0);

    const res = jwtService.verify(token);
    expect(res.valid).toBe(true);
    expect(res.payload.sub).toBe("123");
    expect(res.payload.email).toBe("u@example.com");
    expect(Array.isArray(res.payload.roles)).toBe(true);
    expect(res.payload.iss).toBe("jest-issuer");
    expect(res.payload.aud).toBe("jest-aud");
    expect(res.payload.iat).toBeGreaterThan(0);
    expect(res.payload.exp).toBeGreaterThan(res.payload.iat);
  });

  test("verify detects expired token", () => {
    const { token } = jwtService.sign({ sub: "exp" }, { expiresInSeconds: -10 });
    const res = jwtService.verify(token);
    expect(res.valid).toBe(false);
    expect(res.error).toBe("token_expired");
  });

  test("verify fails on invalid format", () => {
    const res = jwtService.verify("not-a-jwt");
    expect(res.valid).toBe(false);
    expect(res.error).toBe("invalid_token");
  });

  test("verify fails on invalid signature", () => {
    const { token } = jwtService.sign({ sub: "abc" });
    const broken = tamperToken(token);
    const res = jwtService.verify(broken);
    expect(res.valid).toBe(false);
    expect(res.error).toBe("invalid_signature");
  });
});
