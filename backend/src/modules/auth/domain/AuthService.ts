// AuthService - handles login verification and token issuance
// Uses UserRepository to fetch users and PasswordHasher to verify password.
// Sensitive data must never be logged or exposed.

import { IUserRepository } from '../../user/repository/UserRepository';
import { PasswordHasher } from '../../../core/security/passwordHasher';
import { isEmailValid, normalizeEmail } from '../../../core/security/validation';
import { logger } from '../../../core/logging/logger';
import { JwtService, hashRefreshToken } from '../../../core/jwt/jwtService';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
  refreshExpiresIn: number; // seconds
  user: { id: string; email: string; status: string };
}

export class AuthService {
  constructor(
    private readonly repo: IUserRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService
  ) {}

  async login(email: string, password: string, context?: { ip?: string; userAgent?: string; fingerprint?: string }): Promise<LoginResult> {
    // Normalize and validate input
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      logger.warn('Login missing required fields');
      throw new Error('invalid_input');
    }
    const normalizedEmail = normalizeEmail(email);
    if (!isEmailValid(normalizedEmail)) {
      logger.warn('Login invalid email format');
      throw new Error('invalid_input');
    }

    // Lookup user (avoid user enumeration in responses)
    const user = await this.repo.findByEmail(normalizedEmail);

    // Create constant-time like path: verify against real hash if user exists; otherwise verify against dummy
    const dummyHash = 'scrypt:N=16384,r=8,p=1,keylen=64$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    let passwordOk = false;
    if (user) {
      passwordOk = await this.hasher.verify(password, user.passwordHash, user.salt ?? undefined);
    } else {
      // slow path digest to mitigate timing diff
      try { await this.hasher.verify(password, dummyHash, 'AAAAAAAAAAAAAAAAAAAAAA=='); } catch {}
      passwordOk = false;
    }

    if (!user || !passwordOk) {
      // Do not reveal what was wrong
      logger.warn('Login invalid credentials');
      const e: any = new Error('invalid_credentials');
      (e.code = 401);
      throw e;
    }

    // Check account status
    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      const e: any = new Error('account_disabled');
      (e.code = 403);
      throw e;
    }
    if (user.status === 'PENDING') {
      const e: any = new Error('account_unverified');
      (e.code = 403);
      throw e;
    }

    // Issue tokens
    const access = this.jwt.signAccess({ sub: user.id, email: user.email, roles: [] });
    const refresh = this.jwt.generateRefreshToken();

    // Persist session (hash only) - integration handled by HTTP route using createSessionForLogin
    // We still compute hash here to demonstrate policy (not stored here)
    const refreshHash = hashRefreshToken(refresh.token);
    void refreshHash;
    void context;

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      tokenType: 'Bearer',
      expiresIn: access.expiresIn,
      refreshExpiresIn: this.jwt.getConfig().refreshTtlSec,
      user: { id: user.id, email: user.email, status: user.status },
    };
  }
}
