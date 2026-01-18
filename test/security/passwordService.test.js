"use strict";

const { passwordService } = require("../../src/security");

describe("passwordService", () => {
  test("hashPassword produces non-deterministic output and not equal to plain", async () => {
    const pwd = "Str0ng!Passw0rd";
    const h1 = await passwordService.hashPassword(pwd);
    const h2 = await passwordService.hashPassword(pwd);

    expect(typeof h1).toBe("string");
    expect(typeof h2).toBe("string");
    expect(h1).not.toEqual(pwd);
    expect(h2).not.toEqual(pwd);
    // due to random salt, two hashes should differ
    expect(h1).not.toEqual(h2);
  });

  test("verifyPassword returns true for correct and false for wrong password", async () => {
    const pwd = "An0ther$Str0ng";
    const wrong = "An0ther$Str0ng!";
    const hash = await passwordService.hashPassword(pwd);

    await expect(passwordService.verifyPassword(pwd, hash)).resolves.toBe(true);
    await expect(passwordService.verifyPassword(wrong, hash)).resolves.toBe(false);
    await expect(passwordService.verifyPassword(pwd, "invalid-format")).resolves.toBe(false);
  });
});
