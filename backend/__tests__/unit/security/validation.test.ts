import { normalizeEmail, isEmailValid, validatePassword, getDefaultPasswordPolicy } from '../../../src/core/security/validation';

describe('Email validation', () => {
  it('normalizeEmail should trim and lowercase', () => {
    expect(normalizeEmail('  UsEr@Example.Com  ')).toBe('user@example.com');
  });

  it('isEmailValid should accept valid formats and reject invalid ones', () => {
    const valids = [
      'user@example.com',
      'USER@EXAMPLE.COM',
      'user.name+tag@sub.domain.io',
      ' first.last@domain.co '.trim(),
    ];
    const invalids = [
      '',
      'user',
      'user@',
      '@domain.com',
      'user@domain',
      'user@domain.',
      'user@ domain.com',
      'user@@domain.com',
    ];

    for (const e of valids) {
      expect(isEmailValid(e)).toBe(true);
    }
    for (const e of invalids) {
      expect(isEmailValid(e)).toBe(false);
    }
  });
});

describe('Password policy validation', () => {
  beforeEach(() => {
    // Set policy via env to default function
    process.env.PASSWORD_MIN_LENGTH = '10';
    process.env.PASSWORD_REQUIRE_UPPERCASE = 'true';
    process.env.PASSWORD_REQUIRE_LOWERCASE = 'true';
    process.env.PASSWORD_REQUIRE_DIGIT = 'true';
    process.env.PASSWORD_REQUIRE_SPECIAL = 'true';
  });

  it('should flag too short passwords', () => {
    const result = validatePassword('Ab1!x', getDefaultPasswordPolicy());
    expect(result.valid).toBe(false);
    expect(result.reasons.some(r => r.includes('at least'))).toBe(true);
  });

  it('should flag missing required character classes', () => {
    const policy = getDefaultPasswordPolicy();

    const noUpper = validatePassword('lowercase1!', { ...policy, requireUppercase: true });
    expect(noUpper.valid).toBe(false);

    const noLower = validatePassword('UPPERCASE1!', { ...policy, requireLowercase: true });
    expect(noLower.valid).toBe(false);

    const noDigit = validatePassword('NoDigit!!', { ...policy, minLength: 9, requireDigit: true });
    expect(noDigit.valid).toBe(false);

    const noSpecial = validatePassword('NoSpecial1', { ...policy, requireSpecial: true });
    expect(noSpecial.valid).toBe(false);
  });

  it('should accept a valid password meeting the policy', () => {
    const result = validatePassword('Str0ngPass!', getDefaultPasswordPolicy());
    expect(result.valid).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });
});
