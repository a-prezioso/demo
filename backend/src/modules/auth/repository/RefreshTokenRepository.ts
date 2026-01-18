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
}
