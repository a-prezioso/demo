// HTTP routes for user profile (GET /api/me, PUT/PATCH /api/me)
// Uses JWT auth middleware to identify the user. Avoid logging sensitive data.

import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { requireAuth } from '../../../../core/jwt/authMiddleware';
import { JwtService } from '../../../../core/jwt/jwtService';
import { InMemoryProfileRepository } from '../../repository/ProfileRepository';
import { ProfileService } from '../../domain/services/ProfileService';
import { logger } from '../../../../core/logging/logger';

export const profileRouter: Router = express.Router();

// wire dependencies (in-memory repo)
const jwt = new JwtService();
const repo = new InMemoryProfileRepository();
const service = new ProfileService(repo);

// GET /api/me
profileRouter.get('/me', requireAuth({ jwt }), async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const user = (req as any).user as { id: string; email: string } | undefined;
    if (!user?.id) return res.status(401).json({ error: 'unauthorized' });
    const dto = await service.getProfile(user.id);
    return res.status(200).json(dto);
  } catch (_e) {
    logger.error('Profile fetch internal error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT/PATCH /api/me
const handleUpdate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string; email: string } | undefined;
    if (!user?.id) return res.status(401).json({ error: 'unauthorized' });

    const { firstName, lastName, avatarUrl } = req.body || {};

    // Input type check
    const allowedKeys = ['firstName', 'lastName', 'avatarUrl'];
    const extraKeys = Object.keys(req.body || {}).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({ error: 'invalid_input' });
    }

    if (firstName !== undefined && typeof firstName !== 'string' && firstName !== null) {
      return res.status(400).json({ error: 'invalid_input' });
    }
    if (lastName !== undefined && typeof lastName !== 'string' && lastName !== null) {
      return res.status(400).json({ error: 'invalid_input' });
    }
    if (avatarUrl !== undefined && typeof avatarUrl !== 'string' && avatarUrl !== null) {
      return res.status(400).json({ error: 'invalid_input' });
    }

    try {
      const dto = await service.updateProfile(user.id, { firstName, lastName, avatarUrl });
      return res.status(200).json(dto);
    } catch (err: any) {
      const msg = err?.message;
      if (msg === 'invalid_firstName' || msg === 'invalid_lastName' || msg === 'invalid_avatar') {
        return res.status(400).json({ error: 'invalid_input' });
      }
      logger.error('Profile update internal error');
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (_e) {
    logger.error('Profile update handler error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

profileRouter.put('/me', requireAuth({ jwt }), handleUpdate);
profileRouter.patch('/me', requireAuth({ jwt }), handleUpdate);
