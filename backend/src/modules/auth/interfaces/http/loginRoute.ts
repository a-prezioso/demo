// HTTP route for login - POST /api/auth/login
// Wires AuthService with existing in-memory user repository and scrypt hasher.

import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { authRepo } from '../../../user/interfaces/http/authRoutes';
import { ScryptPasswordHasher } from '../../../../core/security/passwordHasher';
import { JwtService } from '../../../../core/jwt/jwtService';
import { AuthService } from '../../domain/AuthService';
import { logger } from '../../../../core/logging/logger';
import { createSessionForLogin } from './refreshRoutes';

// Wire dependencies (mirror pattern from signup route) reusing the same in-memory repo
const hasher = new ScryptPasswordHasher();
const jwt = new JwtService();
const authService = new AuthService(authRepo, hasher, jwt);

export const loginRouter: Router = express.Router();

// POST /api/auth/login
// Body: { email: string; password: string }
loginRouter.post('/login', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, password } = req.body || {};

    const result = await authService.login(email, password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });

    // Persist refresh session (hash only)
    await createSessionForLogin(result.user.id, result.refreshToken, {
      exp: Math.floor(Date.now() / 1000) + jwt.getConfig().refreshTtlSec,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshExpiresIn: result.refreshExpiresIn,
      user: result.user,
    });
  } catch (err: any) {
    const code = err?.code || 400;
    const errMsg = typeof err?.message === 'string' ? err.message : 'invalid_input';

    if (code === 401) return res.status(401).json({ error: errMsg });
    if (code === 403) return res.status(403).json({ error: errMsg });

    logger.warn('Login error');
    return res.status(400).json({ error: 'invalid_input' });
  }
});
