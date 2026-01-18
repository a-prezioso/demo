"use strict";

// User model access helpers (pure, unit-test friendly)
// Builds a new user object suitable for insertion, enforcing required fields

const { validationService } = require("../security");

const DEFAULT_STATUS = "ACTIVE";
const MIN_PASSWORD_HASH_LENGTH = 20; // mirrors DB constraint

function buildNewUser({ email, passwordHash, status = DEFAULT_STATUS, verificationToken = null, verificationExpiresAt = null } = {}) {
  // Validate email using existing validation service
  const emailResult = validationService.validateEmail(email);
  if (!emailResult.valid) {
    throw new Error(emailResult.error || "Invalid email");
  }
  const normalizedEmail = emailResult.email;

  if (typeof passwordHash !== "string" || passwordHash.length < MIN_PASSWORD_HASH_LENGTH) {
    throw new Error("passwordHash is required and must be a non-empty string");
  }

  const user = {
    email: normalizedEmail,
    password_hash: passwordHash,
    status: status || DEFAULT_STATUS,
    verification_token: verificationToken,
    verification_expires_at: verificationExpiresAt,
  };

  return user;
}

module.exports = {
  buildNewUser,
  _DEFAULT_STATUS: DEFAULT_STATUS,
};
