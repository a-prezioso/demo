// AuthController - HTTP endpoint for user signup and login
// This file defines Express-like handlers without binding to a specific server framework
// IMPORTANT: Never log sensitive values

import type { Request, Response } from 'express';
import { SignupService } from '../service/SignupService';
import type { IUserRepository } from '../repository/UserRepository';
import { AuthService } from '../../auth/service/AuthService';

export class AuthController {
  constructor(private readonly signupService: SignupService, private readonly authService: AuthService) {}

  static build(usersRepo: IUserRepository): AuthController {
    const service = new SignupService(usersRepo);
    const auth = new AuthService(usersRepo);
    return new AuthController(service, auth);
  }

  // POST /api/auth/signup
  signup = async (req: Request, res: Response) => {
    try {
      const { email, password } = (req.body || {}) as { email?: string; password?: string };
      const result = await this.signupService.signup({ email: email ?? '', password: password ?? '' });
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (e: any) {
      // Map known errors to HTTP codes with safe messages
      if (e?.code === 'BAD_REQUEST') {
        return res.status(400).json({ success: false, error: { message: 'Invalid input', details: e.details || [] } });
      }
      if (e?.code === 'CONFLICT') {
        return res.status(409).json({ success: false, error: { message: 'Email already registered' } });
      }
      // generic error
      return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
  };

  // POST /api/auth/login
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = (req.body || {}) as { email?: string; password?: string };
      const result = await this.authService.login({ email: email ?? '', password: password ?? '' }, {
        userAgent: req.headers['user-agent'] as string | undefined,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      });
      return res.status(200).json({ success: true, data: result });
    } catch (e: any) {
      if (e?.code === 'BAD_REQUEST') {
        return res.status(400).json({ success: false, error: { message: 'Invalid input', details: e.details || [] } });
      }
      if (e?.code === 'UNAUTHORIZED') {
        return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
      }
      if (e?.code === 'LOCKED') {
        return res.status(423).json({ success: false, error: { message: 'Account not active' } });
      }
      if (e?.code === 'FORBIDDEN') {
        return res.status(403).json({ success: false, error: { message: 'Access denied' } });
      }
      return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
  };
}
