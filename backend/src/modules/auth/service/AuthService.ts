// AuthService - handles login, credential verification, and token issuance
// IMPORTANT: Never log sensitive info

import { InputValidator } from '../../../core/validation';
import { JwtService, PasswordService } from '../../../core/security';
import type { LoginRequestDTO, TokenResponseDTO } from '../domain/dto/JwtDTO';
import type { IUserRepository } from '../../user/repository/UserRepository';

export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordSvc: PasswordService = new PasswordService(),
    private readonly jwt: JwtService = new JwtService()
  ) {}

  async login(payload: LoginRequestDTO, ctx?: { userAgent?: string; ip?: string }): Promise<TokenResponseDTO & { user: { id: string; email: string; status: string } }> {
    const email = InputValidator.normalizeEmail(payload?.email || '');
    const password = payload?.password ?? '';

    const errors: string[] = [];
    if (!email) errors.push('email is required');
    if (!password) errors.push('password is required');
    if (email && !InputValidator.isValidEmail(email)) errors.push('invalid email format');

    if (errors.length > 0) {
      const err: any = new Error('Validation error');
      err.code = 'BAD_REQUEST';
      err.details = errors;
      throw err;
    }

    // Retrieve user (avoid leaking existence)
    let user = null;
    try {
      user = await this.users.findByEmail(email);
    } catch (e) {
      // treat as not found to avoid enumeration
      user = null;
    }

    // Always perform a verification to equalize timing
    const fakeHash = '$sc$N=16384,r=8,p=1$w7r1Z5r0cQ9d0bE7TgW0Nw==$q2mYJvS+oZ1m6p1o9Uq1jKpO4x5fS0qv8HqH0k2V1rY='; // random-looking placeholder
    const storedHash = user?.password_hash || fakeHash;
    const passwordOk = await this.passwordSvc.verifyPassword(password, storedHash);

    if (!user || !passwordOk) {
      const err: any = new Error('Invalid credentials');
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      const err: any = new Error('Account not active');
      err.code = user.status === 'SUSPENDED' ? 'FORBIDDEN' : 'LOCKED';
      err.status = user.status;
      throw err;
    }

    // Issue tokens
    const access = this.jwt.signAccessToken(user.id, user.email, []);
    const refresh = this.jwt.generateRefreshToken();

    // Persist refresh token (best-effort if repo supports it). We add a simple optional hook method pattern.
    await this.persistRefreshIfSupported({
      userId: user.id,
      tokenHash: refresh.hash,
      issuedAt: refresh.issuedAt,
      expiresAt: refresh.expiresAt,
      userAgent: ctx?.userAgent,
      ipAddress: ctx?.ip,
      familyId: refresh.familyId,
    });

    return {
      accessToken: access.token,
      tokenType: 'Bearer',
      expiresIn: access.expiresIn,
      refreshToken: refresh.token,
      user: { id: user.id, email: user.email, status: user.status },
    };
  }

  private async persistRefreshIfSupported(rec: {
    userId: string;
    tokenHash: string;
    issuedAt: Date;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
    familyId: string;
  }): Promise<void> {
    // Look for an optional repository with createRefreshToken method
    const repoAny = this.users as any;
    if (typeof repoAny.createRefreshToken === 'function') {
      try {
        await repoAny.createRefreshToken(rec);
      } catch {
        // swallow to avoid login failure on persistence hiccup
      }
    }
  }
}
