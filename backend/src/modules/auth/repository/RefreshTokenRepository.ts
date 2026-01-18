// Repository contract for persisting refresh tokens (optional implementation)

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  familyId: string;
}

export interface RefreshTokenRecord extends CreateRefreshTokenInput {
  id: string;
  revokedAt?: Date | null;
  revokedReason?: string | null;
  replacementTokenId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshTokenRepository {
  createRefreshToken(data: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  // Lookup by hashed refresh token
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  // Revoke a specific token by id, optionally linking to a replacement token id
  revokeRefreshToken(id: string, reason?: string, replacementTokenId?: string | null): Promise<void>;
  // Revoke all active tokens for a user (e.g., global logout)
  revokeAllUserTokens(userId: string, reason?: string): Promise<void>;
}
