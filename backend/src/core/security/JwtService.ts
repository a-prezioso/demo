/*
 * JwtService - minimal JWT (HS256) creation and refresh token generation
 * - No external deps; uses Node crypto
 * - Access token: JWT signed with HS256
 * - Refresh token: cryptographically random opaque token; only HMAC-SHA256 hash stored
 */

import { createHmac, randomBytes } from 'crypto';

export interface JwtServiceConfig {
  issuer?: string;
  audience?: string;
  accessSecret?: string; // HS256 secret
  refreshSecret?: string; // used to HMAC-hash refresh tokens
  accessTtl?: string | number; // e.g., '15m' or seconds number
  refreshTtl?: string | number; // e.g., '30d' or seconds number
  refreshBytes?: number; // default 64
}

export interface AccessTokenResult {
  token: string;
  expiresIn: number; // seconds
  expiresAt: Date;
}

export interface RefreshTokenResult {
  token: string; // plaintext token to return to client
  hash: string; // HMAC-SHA256(base64url) digest to persist
  issuedAt: Date;
  expiresAt: Date;
  familyId: string; // random id to group tokens (rotation)
}

function base64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function parseDurationToSeconds(val: string | number | undefined, fallback: number): number {
  if (typeof val === 'number' && isFinite(val) && val > 0) return Math.floor(val);
  const raw = (val as string) || '';
  if (!raw) return fallback;
  const m = /^([0-9]+)\s*([smhd])?$/.exec(raw.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || 's') as 's' | 'm' | 'h' | 'd';
  const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return n * mult;
}

function envOr(name: string, def: string): string {
  const v = process.env[name];
  return (v && v.length > 0) ? v : def;
}

export class JwtService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtlSec: number;
  private readonly refreshTtlSec: number;
  private readonly refreshBytes: number;

  constructor(cfg?: JwtServiceConfig) {
    this.issuer = cfg?.issuer ?? envOr('JWT_ISSUER', 'smartdesk');
    this.audience = cfg?.audience ?? envOr('JWT_AUDIENCE', 'smartdesk-pwa');
    this.accessSecret = cfg?.accessSecret ?? envOr('JWT_ACCESS_SECRET', 'change-me-access-secret');
    this.refreshSecret = cfg?.refreshSecret ?? envOr('JWT_REFRESH_SECRET', 'change-me-refresh-secret');
    this.accessTtlSec = parseDurationToSeconds(cfg?.accessTtl ?? process.env.JWT_ACCESS_TTL ?? '900', 900);
    this.refreshTtlSec = parseDurationToSeconds(cfg?.refreshTtl ?? process.env.JWT_REFRESH_TTL ?? '2592000', 30 * 24 * 3600);
    this.refreshBytes = cfg?.refreshBytes ?? (parseInt(process.env.REFRESH_TOKEN_BYTES || '64', 10) || 64);
  }

  signAccessToken(subject: string, email: string, roles?: string[]): AccessTokenResult {
    const header = { alg: 'HS256', typ: 'JWT' };
    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + this.accessTtlSec;
    const payload: any = {
      sub: subject,
      email,
      roles: roles && roles.length > 0 ? roles : undefined,
      iss: this.issuer,
      aud: this.audience,
      iat: nowSec,
      exp,
      ver: 1,
    };

    const encHeader = base64url(JSON.stringify(header));
    const encPayload = base64url(JSON.stringify(payload));
    const signingInput = `${encHeader}.${encPayload}`;
    const sig = createHmac('sha256', this.accessSecret).update(signingInput).digest();
    const jwt = `${signingInput}.${base64url(sig)}`;

    return { token: jwt, expiresIn: this.accessTtlSec, expiresAt: new Date(exp * 1000) };
  }

  generateRefreshToken(): RefreshTokenResult {
    const rnd = randomBytes(this.refreshBytes);
    const token = base64url(rnd);
    const issuedAt = new Date();
    const expiresAt = new Date(Date.now() + this.refreshTtlSec * 1000);
    const familyId = base64url(randomBytes(16));
    const hash = this.hashRefreshToken(token);
    return { token, hash, issuedAt, expiresAt, familyId };
  }

  hashRefreshToken(token: string): string {
    const mac = createHmac('sha256', this.refreshSecret).update(token).digest();
    return base64url(mac);
  }
}

export default JwtService;
