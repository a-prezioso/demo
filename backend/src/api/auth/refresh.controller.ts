/**
 * Refresh and logout controllers for JWT lifecycle management.
 * - POST /auth/refresh: accepts a refreshToken, validates it, rotates session, returns new tokens
 * - POST /auth/logout: accepts a refreshToken to revoke that single session (idempotent)
 * - POST /auth/logoutAll: revokes all sessions for the authenticated user (requires auth middleware)
 */

import { verifyJwt, signAccessToken, signRefreshToken, hashRefreshToken } from '../../security/jwt.service';
import type { RequestLike, ResponseLike } from './auth.controller';
import type { AuthenticatedRequestLike } from './jwt.middleware';
import { findActiveSessionByHash, rotateSessionToken, revokeSessionById, revokeAllSessionsForUser } from '../../modules/sessions/session.repository';

export async function refreshHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  try {
    const { refreshToken } = (req.body || {}) as { refreshToken?: string };

    if (!refreshToken || typeof refreshToken !== 'string') {
      res.status(400).json({ error: 'invalid_input', details: { refreshToken: 'required' } });
      return;
    }

    const verification = verifyJwt(refreshToken);
    if (!verification.valid || !verification.payload) {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    const payload = verification.payload as any;
    if (payload.typ !== 'refresh') {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const session = await findActiveSessionByHash(tokenHash);
    if (!session) {
      // unknown, revoked or expired session associated with this token hash
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    // Ensure the token belongs to the same user id in payload
    if (!payload.sub || session.userId !== payload.sub) {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    const user = { id: String(payload.sub), email: String(payload.email || '') };

    // Always issue a new access token
    const access = signAccessToken(user);

    // Rotate refresh token for better security (single-use refresh tokens)
    const newRefresh = signRefreshToken(user);
    try {
      const newHash = hashRefreshToken(newRefresh.token);
      const userAgent = (req as any).headers?.['user-agent'] || (req as any).headers?.['User-Agent'] || null;
      const ip = (req as any).ip || (req as any).ipAddress || (req as any).headers?.['x-forwarded-for'] || null;
      await rotateSessionToken(session.id, newHash, newRefresh.expiresAt, {
        userAgent: typeof userAgent === 'string' ? userAgent : null,
        ipAddress: typeof ip === 'string' ? ip : null,
      });
    } catch (_e) {
      // If rotation fails for any reason, revoke the current session to prevent token reuse
      try { await revokeSessionById(session.id); } catch (_) {}
      res.status(500).json({ error: 'internal_error' });
      return;
    }

    res.status(200).json({
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshToken: newRefresh.token,
      refreshTokenExpiresAt: newRefresh.expiresAt.toISOString(),
      tokenType: 'Bearer',
    });
  } catch (_err) {
    res.status(500).json({ error: 'internal_error' });
  }
}

export async function logoutHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  try {
    const { refreshToken } = (req.body || {}) as { refreshToken?: string };
    if (!refreshToken || typeof refreshToken !== 'string') {
      // To avoid leaking details, treat missing/invalid token as a no-op success for logout
      res.status(200).json({ ok: true });
      return;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    try {
      const session = await findActiveSessionByHash(tokenHash);
      if (session) {
        await revokeSessionById(session.id);
      }
    } catch (_e) {
      // swallow errors for logout to remain idempotent
    }

    res.status(200).json({ ok: true });
  } catch (_err) {
    res.status(200).json({ ok: true });
  }
}

export async function logoutAllHandler(req: AuthenticatedRequestLike, res: ResponseLike): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    try {
      await revokeAllSessionsForUser(userId);
    } catch (_e) {
      // do not leak errors; consider it success from API perspective
    }
    res.status(200).json({ ok: true });
  } catch (_err) {
    res.status(200).json({ ok: true });
  }
}
