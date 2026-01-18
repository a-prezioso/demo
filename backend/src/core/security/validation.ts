// validation utilities for signup inputs
// Ensure nothing sensitive gets logged. Export pure functions for reuse.

// Basic email RFC-like validation and normalization
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// Reasonable email regex (doesn't aim to be full RFC 5322, but safe for typical cases)
// - local@domain.tld with basic chars
// - prevents spaces and ensures one @, at least one dot in domain
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmailValid = (email: string): boolean => EMAIL_REGEX.test(normalizeEmail(email));

// Password policy
// Defaults can be overridden by env vars
// MIN length, require uppercase, lowercase, digit, special
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
}

const envInt = (v?: string, fallback?: number): number | undefined => {
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const getDefaultPasswordPolicy = (): PasswordPolicy => ({
  minLength: envInt(process.env.PASSWORD_MIN_LENGTH, 10)!,
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE ? process.env.PASSWORD_REQUIRE_UPPERCASE === 'true' : true,
  requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE ? process.env.PASSWORD_REQUIRE_LOWERCASE === 'true' : true,
  requireDigit: process.env.PASSWORD_REQUIRE_DIGIT ? process.env.PASSWORD_REQUIRE_DIGIT === 'true' : true,
  requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL ? process.env.PASSWORD_REQUIRE_SPECIAL === 'true' : true,
});

export interface PasswordValidationResult {
  valid: boolean;
  reasons: string[];
}

export const validatePassword = (password: string, policy: PasswordPolicy = getDefaultPasswordPolicy()): PasswordValidationResult => {
  const reasons: string[] = [];
  if (typeof password !== 'string' || password.length < policy.minLength) {
    reasons.push(`Password must be at least ${policy.minLength} characters long`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) reasons.push('Password must contain at least one uppercase letter');
  if (policy.requireLowercase && !/[a-z]/.test(password)) reasons.push('Password must contain at least one lowercase letter');
  if (policy.requireDigit && !/[0-9]/.test(password)) reasons.push('Password must contain at least one digit');
  if (policy.requireSpecial && !/[!@#$%^&*()_\-+=[\]{};:'",.<>/?`~|\\]/.test(password)) reasons.push('Password must contain at least one special character');

  return { valid: reasons.length === 0, reasons };
};

export interface SignupInputValidationResult {
  emailValid: boolean;
  password: PasswordValidationResult;
}

export const validateSignupInput = (email: string, password: string): SignupInputValidationResult => ({
  emailValid: isEmailValid(email),
  password: validatePassword(password),
});
