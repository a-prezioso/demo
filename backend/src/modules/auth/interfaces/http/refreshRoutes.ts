// HTTP routes for refresh and logout
// Provides POST /api/auth/refresh and POST /api/auth/logout
// Uses in-memory session repository and JwtService. Avoids leaking sensitive info.

import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { JwtService, hashRefreshToken } from '../../../../core/jwt/jwtService';
import { InMemorySessionRepository } from '../../repository/SessionRepository';
import { authRepo } from '../../../user/interfaces/http/authRoutes';
import { logger } from '../../../../core/logging/logger';

export const refreshRouter: Router = express.Router();

// Singletons for this simple setup
const jwt = new JwtService();
const sessions = new InMemorySessionRepository();

// POST /api/auth/refresh
// Body: { refreshToken: string }
refreshRouter.post('/refresh', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'invalid_input' });
    }

    const hash = hashRefreshToken(refreshToken);
    const rec = await sessions.findByTokenHash(hash);

    // Generic 401 for any invalid/expired/revoked cases
    if (!rec) {
      return res.status(401).json({ error: 'invalid_refresh' });
    }

    // Check expiration and revocation
    const now = new Date();
    if (rec.revokedAt || now >= rec.expiresAt) {
      return res.status(401).json({ error: 'invalid_refresh' });
    }

    // Load user to issue token (we avoid leaking existence otherwise)
    const user = await authRepo.findById(rec.userId);
    if (!user || user.status !== 'ACTIVE') {
      // On user no longer valid, revoke this session and return 401
      await sessions.revokeByTokenHash(hash);
      return res.status(401).json({ error: 'invalid_refresh' });
    }

    const access = jwt.signAccess({ sub: user.id, email: user.email, roles: [] });

    // Optional rotation: keep same refresh token in this skeleton to keep tests simple
    // In a real setup we would rotate: issue new refresh, revoke old, create new session.

    return res.status(200).json({
      accessToken: access.token,
      tokenType: 'Bearer',
      expiresIn: access.expiresIn,
    });
  } catch (_err) {
    logger.warn('Refresh error');
    return res.status(401).json({ error: 'invalid_refresh' });
  }
});

// POST /api/auth/logout
// Body: { refreshToken?: string, all?: boolean }
refreshRouter.post('/logout', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { refreshToken, all } = req.body || {};

    if (all === true) {
      // Require token to identify the user/session
      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({ error: 'invalid_input' });
      }
      const hash = hashRefreshToken(refreshToken);
      const rec = await sessions.findByTokenHash(hash);
      if (rec) {
        await sessions.revokeAllForUser(rec.userId);
      }
      return res.status(204).send();
    }

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'invalid_input' });
    }

    const hash = hashRefreshToken(refreshToken);
    await sessions.revokeByTokenHash(hash);
    return res.status(204).send();
  } catch (_err) {
    return res.status(204).send();
  }
});

// Helper to create a session when a user logs in (used by login route)
export const createSessionForLogin = async (userId: string, refreshToken: string, meta?: { exp?: number; ip?: string; userAgent?: string; fingerprint?: string }) => {
  const hash = hashRefreshToken(refreshToken);
  const expiresAt = meta?.exp ? new Date(meta.exp * 1000) : new Date(Date.now() + jwt.getConfig().refreshTtlSec * 1000);
  await sessions.create({
    userId,
    refreshTokenHash: hash,
    issuedAt: new Date(),
    expiresAt,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
    fingerprint: meta?.fingerprint,
  });
};
