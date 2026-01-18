/**
 * Login controller: email+password -> JWT access (and refresh) tokens
 * Framework-agnostic handler signature (RequestLike/ResponseLike) from auth.controller.ts
 */

import { verifyPassword } from '../../security/password.service';
import { findUserByEmail } from '../../modules/users/user.repository';
import { UserStatus } from '../../modules/users/user.model';
import { signAccessToken, signRefreshToken, hashRefreshToken } from '../../security/jwt.service';

import type { RequestLike, ResponseLike } from './auth.controller';

export async function loginHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  try {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !password) {
      res.status(400).json({ error: 'invalid_input' });
      return;
    }

    const user = await findUserByEmail(normalized);
    // Generic error for wrong credentials
    if (!user) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    if (user.status === UserStatus.DISABLED || user.status === UserStatus.SUSPENDED) {
      res.status(403).json({ error: 'account_inactive' });
      return;
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    const access = signAccessToken({ id: user.id, email: user.email });
    const refresh = signRefreshToken({ id: user.id, email: user.email });

    // NOTE: We only return tokens; storing refresh token hash in persistence requires a sessions repository
    // which will be introduced with a refresh/session table. For now we return hash suggestion in comment.
    const _refreshHash = hashRefreshToken(refresh.token);
    // TODO: persist _refreshHash with userId, expiresAt, user-agent/ip for session tracking (future task)

    res.status(200).json({
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
      tokenType: 'Bearer',
    });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
}
