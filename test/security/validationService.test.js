"use strict";

const { validationService } = require("../../src/security");

describe("validationService - email", () => {
  test("valid formats with trim and lowercase", () => {
    const res1 = validationService.validateEmail(" User@Example.COM ");
    expect(res1.valid).toBe(true);
    expect(res1.email).toBe("user@example.com");

    const res2 = validationService.validateEmail("user.name+tag@example.co.uk");
    expect(res2.valid).toBe(true);
    expect(res2.email).toBe("user.name+tag@example.co.uk");
  });

  test("invalid formats", () => {
    expect(validationService.validateEmail("").valid).toBe(false);
    expect(validationService.validateEmail(null).valid).toBe(false);
    expect(validationService.validateEmail("no-at-symbol").valid).toBe(false);
    expect(validationService.validateEmail("user@localhost").valid).toBe(false);
  });
});

describe("validationService - password", () => {
  const policy = {
    MIN_LENGTH: 10,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SYMBOL: true,
    FORBID_COMMON: true,
  };

  test("too short", () => {
    const res = validationService.validatePassword("A1!short", policy);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/at least/);
  });

  test("missing character classes", () => {
    expect(validationService.validatePassword("alllowercase123!", policy).valid).toBe(false);
    expect(validationService.validatePassword("ALLUPPERCASE123!", policy).valid).toBe(false);
    expect(validationService.validatePassword("NoNumbers!!!", policy).valid).toBe(false);
    expect(validationService.validatePassword("NoSymbols123", policy).valid).toBe(false);
  });

  test("common password forbidden", () => {
    const res = validationService.validatePassword("password", policy);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/too common/);
  });

  test("valid password passes", () => {
    const res = validationService.validatePassword("G00dPa$$w0rd!", policy);
    expect(res.valid).toBe(true);
    expect(res.error).toBeNull();
  });
});
