// HTTP routes for authentication (signup)
// This minimal Express-like router exposes POST /api/auth/signup
// It uses UserService to perform validation, hashing, and persistence.
// Sensitive data (password, hash, salt, tokens) are never logged or returned.

import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
import { UserService } from '../../domain/services/UserService';
import { InMemoryUserRepository, DuplicateEmailError } from '../../repository/UserRepository';
import { ScryptPasswordHasher } from '../../../core/security/passwordHasher';
import { validateSignupInput } from '../../../core/security/validation';
import { logger } from '../../../core/logging/logger';

// Wire dependencies (for now using in-memory repo; swap with Prisma repo later)
const repo = new InMemoryUserRepository();
const hasher = new ScryptPasswordHasher();
const userService = new UserService(repo, hasher);

export const authRouter: Router = express.Router();

// POST /api/auth/signup
// Body: { email: string, password: string }
authRouter.post('/signup', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, password } = req.body || {};

    // Basic presence check
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      logger.warn('Signup missing required fields');
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Syntactic + semantic validation
    const validation = validateSignupInput({ email, password });
    if (!validation.emailValid || !validation.password.valid) {
      logger.warn('Signup validation failed', {
        emailValid: validation.emailValid,
        passwordIssues: validation.password.reasons.length,
      });
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Check pre-existence to give quick feedback (still handle race via repo/DB)
    const existing = await userService.getByEmail(email);
    if (existing) {
      logger.info('Signup attempted with existing email');
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user (service handles normalization + hashing)
    const user = await userService.register(email, password);

    // Respond with non-sensitive payload
    return res.status(201).json({
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err: any) {
    if (err instanceof DuplicateEmailError) {
      // Handles race condition where unique constraint rejects insert
      logger.info('Signup conflict due to duplicate email');
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Generic error, do not leak details
    logger.error('Signup internal error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the in-memory repository instance for other routes (e.g., login) to reuse during development/testing
export const authRepo = repo;
