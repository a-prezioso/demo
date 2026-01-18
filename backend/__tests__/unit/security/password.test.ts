import { hashPassword, verifyPassword } from '../../../src/core/security/password';

// Use deterministic env for tests if needed
process.env.SCRYPT_N = '1024';
process.env.SCRYPT_r = '8';
process.env.SCRYPT_p = '1';
process.env.SCRYPT_KEYLEN = '32';

describe('Password hashing and verification', () => {
  it('hashPassword should produce non-deterministic output and not equal to plain', async () => {
    const plain = 'ValidPassw0rd!';

    const a = await hashPassword(plain);
    const b = await hashPassword(plain);

    expect(typeof a.hash).toBe('string');
    expect(a.hash).not.toEqual(plain);
    expect(typeof a.salt === 'string' || a.salt === undefined || a.salt === null).toBe(true);

    // Non-deterministic: at least hash should differ due to random salt
    // If implementation embeds salt in hash, this still should differ
    expect(a.hash).not.toEqual(b.hash);
    if (a.salt && b.salt) {
      expect(a.salt).not.toEqual(b.salt);
    }
  });

  it('verifyPassword should return true for correct password and false for wrong one', async () => {
    const plain = 'AnotherV@lid1';
    const wrong = 'WrongPass123!';

    const { hash, salt } = await hashPassword(plain);

    await expect(verifyPassword(plain, hash, salt)).resolves.toBe(true);
    await expect(verifyPassword(wrong, hash, salt)).resolves.toBe(false);
  });
});
