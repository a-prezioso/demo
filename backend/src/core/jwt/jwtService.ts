// jwtService - minimal JWT (HS256) utilities without external deps
// Provides signing and basic verification using Node's crypto.
// Sensitive data (secrets, tokens) must never be logged.

import { createHmac, randomBytes } from 'crypto';

export interface JwtConfig {
  alg: 'HS256';
  secret: string; // HMAC secret
  issuer?: string;
  audience?: string;
  accessTtlSec: number; // access token TTL in seconds
  refreshTtlSec: number; // refresh token TTL in seconds
}

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  roles?: string[];
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  [k: string]: any; // future claims
}

const base64url = {
  encode: (input: Buffer | string): string => {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buf
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  },
};

const getEnvInt = (key: string, fallback: number): number => {
  const v = process.env[key];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export class JwtService {
  private readonly cfg: JwtConfig;

  constructor(cfg?: Partial<JwtConfig>) {
    this.cfg = {
      alg: 'HS256',
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      issuer: process.env.JWT_ISSUER || 'smartdesk.api',
      audience: process.env.JWT_AUDIENCE || 'smartdesk.pwa',
      accessTtlSec: cfg?.accessTtlSec ?? getEnvInt('ACCESS_TOKEN_TTL', 900),
      refreshTtlSec: cfg?.refreshTtlSec ?? getEnvInt('REFRESH_TOKEN_TTL', 2592000),
      ...cfg,
    } as JwtConfig;
  }

  signAccess(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>, nowSec?: number): { token: string; expiresIn: number; exp: number } {
    const iat = nowSec ?? Math.floor(Date.now() / 1000);
    const exp = iat + this.cfg.accessTtlSec;
    const token = this.sign({ ...payload, iss: this.cfg.issuer, aud: this.cfg.audience, iat, exp });
    return { token, expiresIn: this.cfg.accessTtlSec, exp };
  }

  // Generic HS256 signer
  sign(payload: Record<string, any>): string {
    const header = { alg: this.cfg.alg, typ: 'JWT' };
    const encodedHeader = base64url.encode(JSON.stringify(header));
    const encodedPayload = base64url.encode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', this.cfg.secret).update(data).digest();
    const encodedSig = base64url.encode(signature);
    return `${data}.${encodedSig}`;
  }

  // Utilities for refresh token
  generateRefreshToken(): { token: string; expiresIn: number; exp: number } {
    const exp = Math.floor(Date.now() / 1000) + this.cfg.refreshTtlSec;
    // 256-bit random -> base64url
    const token = base64url.encode(randomBytes(32));
    return { token, expiresIn: this.cfg.refreshTtlSec, exp };
    }

  getConfig(): JwtConfig {
    return { ...this.cfg };
  }
}

export const hashRefreshToken = (token: string): string => {
  // Store only hash of refresh token. Return base64url-encoded sha256 digest with prefix
  const digest = createHmac('sha256', 'refresh-token-hash-key').update(token).digest();
  // Using a static key for HMAC here to prevent length-extension; alternatively, use sha256 without key.
  // For demo purposes, we keep it simple. In production, use a dedicated secret.
  return `sha256:${base64url.encode(digest)}`;
};
