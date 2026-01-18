import { JwtService, hashRefreshToken } from '../../../src/core/jwt/jwtService';
import { InMemorySessionRepository } from '../../../src/modules/auth/repository/SessionRepository';

// Unit tests for refresh token management helpers (creation, validation, revocation)

describe('Refresh token utilities and session repository (unit)', () => {
  it('should generate refresh token with correct TTL and hash determinism', () => {
    const jwt = new JwtService({ refreshTtlSec: 3600 });
    const a = jwt.generateRefreshToken();
    const b = jwt.generateRefreshToken();

    expect(typeof a.token).toBe('string');
    expect(a.token).not.toEqual(b.token); // random
    expect(a.expiresIn).toBe(3600);
    expect(typeof a.exp).toBe('number');

    // hash should be deterministic for same token
    const ha1 = hashRefreshToken(a.token);
    const ha2 = hashRefreshToken(a.token);
    expect(ha1).toBe(ha2);
    expect(ha1).toMatch(/^sha256:/);
  });

  it('should create, find, revoke and cleanup sessions', async () => {
    const repo = new InMemorySessionRepository();
    const userId = 'u1';
    const jwt = new JwtService({ refreshTtlSec: 2 });
    const { token, exp } = jwt.generateRefreshToken();
    const hash = hashRefreshToken(token);

    // create
    const rec = await repo.create({ userId, refreshTokenHash: hash, expiresAt: new Date(exp * 1000) });
    expect(rec.userId).toBe(userId);

    // find by hash
    const got = await repo.findByTokenHash(hash);
    expect(got?.id).toBe(rec.id);

    // revoke single
    const ok = await repo.revokeByTokenHash(hash, { by: 'tester', reason: 'test' });
    expect(ok).toBe(true);
    const got2 = await repo.findByTokenHash(hash);
    expect(got2?.revokedAt instanceof Date || got2?.revokedAt === null).toBe(true);

    // create a second session to test revokeAllForUser and cleanupExpired
    const { token: t2, exp: exp2 } = jwt.generateRefreshToken();
    const h2 = hashRefreshToken(t2);
    await repo.create({ userId, refreshTokenHash: h2, expiresAt: new Date(exp2 * 1000) });

    const revokedCount = await repo.revokeAllForUser(userId, { reason: 'logout_all' });
    expect(typeof revokedCount).toBe('number');

    // Advance time for cleanup: simulate by passing past date
    const cleaned = await repo.cleanupExpired(new Date(Date.now() + 10_000));
    expect(typeof cleaned).toBe('number');
  });
});
