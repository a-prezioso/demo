// AuthController - HTTP endpoint for user signup
// This file defines Express-like handlers without binding to a specific server framework
// IMPORTANT: Never log sensitive values

import type { Request, Response } from 'express';
import { SignupService } from '../service/SignupService';
import type { IUserRepository } from '../repository/UserRepository';

export class AuthController {
  constructor(private readonly signupService: SignupService) {}

  static build(usersRepo: IUserRepository): AuthController {
    const service = new SignupService(usersRepo);
    return new AuthController(service);
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
}
