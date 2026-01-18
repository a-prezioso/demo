// JWT auth middleware/guard
// - Extracts Bearer token from Authorization header
// - Verifies signature, integrity and expiration using JwtService
// - Attaches user info to req.user and claims to req.auth
// - Supports optional role-based authorization and revocation check
// - Never logs secrets or token strings

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { JwtService } from './jwtService';
import { logger } from '../logging/logger';

export type RevocationChecker = (claims: any, token: string) => Promise<boolean> | boolean; // true => revoked

export interface RequireAuthOptions {
  roles?: string[]; // require user to have at least one of these roles
  requireAllRoles?: boolean; // if true, user must have all roles listed
  isTokenRevoked?: RevocationChecker; // optional external revocation check (e.g., DB sessions)
  jwt?: JwtService; // allow custom JwtService injection for testing/config
}

const extractBearerToken = (req: Request): string | null => {
  const header = req.headers['authorization'] || req.headers['Authorization' as any];
  if (!header || typeof header !== 'string') return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
};

const hasRequiredRoles = (userRoles: string[] | undefined, required: string[], requireAll: boolean): boolean => {
  const roles = userRoles || [];
  if (required.length === 0) return true;
  if (requireAll) {
    return required.every(r => roles.includes(r));
  }
  return required.some(r => roles.includes(r));
};

export const requireAuth = (options?: RequireAuthOptions): RequestHandler => {
  const jwt = options?.jwt ?? new JwtService();
  const requiredRoles = options?.roles ?? [];
  const requireAll = options?.requireAllRoles === true;
  const isTokenRevoked = options?.isTokenRevoked;

  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const token = extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      let claims: any;
      try {
        claims = jwt.verify(token);
      } catch (err: any) {
        switch (err?.message) {
          case 'token_expired':
            return res.status(401).json({ error: 'token_expired' });
          case 'invalid_signature':
          case 'invalid_token':
          case 'malformed_token':
          default:
            return res.status(401).json({ error: 'invalid_token' });
        }
      }

      if (isTokenRevoked) {
        try {
          const revoked = await isTokenRevoked(claims, token);
          if (revoked) {
            return res.status(401).json({ error: 'token_revoked' });
          }
        } catch (_e) {
          // Fail safe: if revocation check throws, consider token invalid
          return res.status(401).json({ error: 'invalid_token' });
        }
      }

      // Attach user to request (avoid logging sensitive token)
      const user = {
        id: claims.sub as string,
        email: claims.email as string,
        roles: (claims.roles as string[]) || [],
      };
      (req as any).user = user;
      (req as any).auth = { claims };

      // Role authorization check
      if (requiredRoles.length > 0 && !hasRequiredRoles(user.roles, requiredRoles, requireAll)) {
        return res.status(403).json({ error: 'forbidden' });
      }

      return _next();
    } catch (_err) {
      logger.warn('Auth middleware error');
      return res.status(401).json({ error: 'unauthorized' });
    }
  };
};

export const requireRoles = (roles: string[] | string, options?: Omit<RequireAuthOptions, 'roles'>): RequestHandler => {
  const r = Array.isArray(roles) ? roles : [roles];
  return requireAuth({ ...options, roles: r });
};
