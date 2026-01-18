"use strict";

const { userModel } = require("../../src/models");

describe("userModel.buildNewUser", () => {
  test("creates instance with required fields", () => {
    const user = userModel.buildNewUser({
      email: " USER@Example.com ",
      passwordHash: "scrypt$N=16384,r=8,p=1,keylen=64$YWJj$ZGVm", // format-like string, length >= 20
    });

    expect(user.email).toBe("user@example.com");
    expect(user.password_hash).toBeDefined();
    expect(user.status).toBe("ACTIVE");
    expect(user.verification_token).toBeNull();
    expect(user.verification_expires_at).toBeNull();
  });

  test("throws on missing or invalid fields", () => {
    expect(() => userModel.buildNewUser({})).toThrow(/Email is required|Invalid email/);
    expect(() => userModel.buildNewUser({ email: "invalid", passwordHash: "hash" })).toThrow(/Invalid email/);
    expect(() => userModel.buildNewUser({ email: "a@b.com" })).toThrow(/passwordHash is required/);
  });
});
