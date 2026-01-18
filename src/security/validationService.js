"use strict";

// Validation Service for signup inputs: email and password
// - Email: basic RFC 5322-like format, normalization (trim + lowercase)
// - Password: configurable policy (min length, character diversity)
// The service MUST never log passwords or hashes.

const DEFAULTS = {
  MIN_LENGTH: parseInt(process.env.SECURITY_PASSWORD_MIN_LENGTH || "10", 10),
  REQUIRE_UPPERCASE: (process.env.SECURITY_PASSWORD_REQUIRE_UPPERCASE || "true").toLowerCase() === "true",
  REQUIRE_LOWERCASE: (process.env.SECURITY_PASSWORD_REQUIRE_LOWERCASE || "true").toLowerCase() === "true",
  REQUIRE_NUMBER: (process.env.SECURITY_PASSWORD_REQUIRE_NUMBER || "true").toLowerCase() === "true",
  REQUIRE_SYMBOL: (process.env.SECURITY_PASSWORD_REQUIRE_SYMBOL || "true").toLowerCase() === "true",
  FORBID_COMMON: (process.env.SECURITY_PASSWORD_FORBID_COMMON || "true").toLowerCase() === "true",
};

// A minimal common password blacklist (extend as needed)
const COMMON_PASSWORDS = new Set([
  "password","123456","123456789","qwerty","111111","abc123","123123","iloveyou","admin","welcome",
]);

function normalizeEmail(email) {
  if (email == null) return null;
  const trimmed = String(email).trim();
  return trimmed.toLowerCase();
}

function isEmailValid(email) {
  // Simple RFC-ish regex: allows local@domain with basic constraints
  // Note: For production-grade validation, prefer a dedicated library.
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email);
}

function validateEmail(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { valid: false, email: null, error: "Email is required" };
  }
  if (!isEmailValid(email)) {
    return { valid: false, email, error: "Invalid email format" };
  }
  // Additional policy could be enforced here (domain allowlist, etc.)
  return { valid: true, email, error: null };
}

function validatePassword(plainPassword, policy = DEFAULTS) {
  if (typeof plainPassword !== "string") {
    return { valid: false, error: "Password must be a string" };
  }
  const pwd = plainPassword; // Do not transform or log
  const reasons = [];

  if (pwd.length < policy.MIN_LENGTH) {
    reasons.push(`Password must be at least ${policy.MIN_LENGTH} characters long`);
  }
  if (policy.FORBID_COMMON && COMMON_PASSWORDS.has(pwd)) {
    reasons.push("Password is too common");
  }
  if (policy.REQUIRE_UPPERCASE && !/[A-Z]/.test(pwd)) {
    reasons.push("Password must include at least one uppercase letter");
  }
  if (policy.REQUIRE_LOWERCASE && !/[a-z]/.test(pwd)) {
    reasons.push("Password must include at least one lowercase letter");
  }
  if (policy.REQUIRE_NUMBER && !/[0-9]/.test(pwd)) {
    reasons.push("Password must include at least one number");
  }
  if (policy.REQUIRE_SYMBOL && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd)) {
    reasons.push("Password must include at least one symbol");
  }

  return {
    valid: reasons.length === 0,
    error: reasons.length ? reasons.join("; ") : null,
  };
}

module.exports = {
  validateEmail,
  validatePassword,
  normalizeEmail,
  _DEFAULTS: DEFAULTS,
};
