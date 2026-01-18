// jwtService - minimal JWT (HS256) utilities without external deps
// Provides signing and basic verification using Node's crypto.
// Sensitive data (secrets, tokens) must never be logged.

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

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
  decode: (input: string): Buffer => {
    // Replace URL-safe chars
    let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' to length % 4 === 0
    const pad = b64.length % 4;
    if (pad === 2) b64 += '==';
    else if (pad === 3) b64 += '=';
    else if (pad !== 0) b64 += '='.repeat(4 - pad);
    return Buffer.from(b64, 'base64');
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

  // Verify HS256 token integrity and expiry; returns claims (payload)
  verify(token: string): any {
    if (!token || typeof token !== 'string') {
      throw new Error('malformed_token');
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('malformed_token');
    }
    const [encodedHeader, encodedPayload, encodedSig] = parts;

    let header: any;
    let payload: any;
    try {
      header = JSON.parse(base64url.decode(encodedHeader).toString('utf8'));
      payload = JSON.parse(base64url.decode(encodedPayload).toString('utf8'));
    } catch {
      throw new Error('malformed_token');
    }

    if (!header || header.alg !== this.cfg.alg) {
      throw new Error('invalid_token');
    }

    // Recompute signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = createHmac('sha256', this.cfg.secret).update(data).digest();
    const gotSig = base64url.decode(encodedSig);

    // Compare safely
    if (expectedSig.length !== gotSig.length || !timingSafeEqual(expectedSig, gotSig)) {
      throw new Error('invalid_signature');
    }

    // Current time (seconds) and optional clock skew
    const now = Math.floor(Date.now() / 1000);
    const skew = getEnvInt('JWT_CLOCK_SKEW_SEC', 30);

    // Validate exp
    if (typeof payload.exp === 'number') {
      if (now >= payload.exp) {
        throw new Error('token_expired');
      }
    }

    // Validate not-before (nbf)
    if (typeof payload.nbf === 'number') {
      if (now + skew < payload.nbf) {
        throw new Error('token_not_yet_valid');
      }
    }

    // Validate issued-at (iat) not in the future beyond skew
    if (typeof payload.iat === 'number') {
      if (payload.iat > now + skew) {
        throw new Error('token_issued_in_future');
      }
    }

    // Optional iss/aud checks when present
    if (payload.iss && this.cfg.issuer && payload.iss !== this.cfg.issuer) {
      throw new Error('invalid_token');
    }
    if (payload.aud && this.cfg.audience && payload.aud !== this.cfg.audience) {
      throw new Error('invalid_token');
    }

    return payload;
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
