// ProfileService - business logic for viewing and updating user profile
// Validates inputs and delegates persistence to ProfileRepository

import { logger } from '../../../core/logging/logger';
import { IProfileRepository, ProfileRecord, UpdateProfileInput } from '../../repository/ProfileRepository';

export interface PublicProfileDTO {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

const sanitizeText = (v?: string | null): string | null => {
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const isValidName = (v: string): boolean => {
  // Allow unicode letters, spaces, hyphen and apostrophe, length 1..80
  if (v.length < 1 || v.length > 80) return false;
  // Basic sanity check; not exhaustive
  return /^[\p{L} .'-]+$/u.test(v);
};

const isValidUrl = (v: string): boolean => {
  if (v.length > 2048) return false;
  // Accept http/https URLs; uploading handled elsewhere
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export class ProfileService {
  constructor(private readonly repo: IProfileRepository) {}

  private toDTO(rec: ProfileRecord): PublicProfileDTO {
    return {
      userId: rec.userId,
      firstName: rec.firstName ?? null,
      lastName: rec.lastName ?? null,
      avatarUrl: rec.avatarUrl ?? null,
    };
  }

  async getProfile(userId: string): Promise<PublicProfileDTO> {
    const rec = await this.repo.getByUserId(userId);
    if (!rec) {
      // initialize empty profile view (not persisted until update)
      return { userId, firstName: null, lastName: null, avatarUrl: null };
    }
    return this.toDTO(rec);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicProfileDTO> {
    // sanitize
    const firstName = sanitizeText(input.firstName ?? null);
    const lastName = sanitizeText(input.lastName ?? null);
    const avatarUrl = sanitizeText(input.avatarUrl ?? null);

    // validate names if provided
    if (firstName !== null && !isValidName(firstName)) {
      logger.warn('Profile update invalid firstName');
      throw new Error('invalid_firstName');
    }
    if (lastName !== null && !isValidName(lastName)) {
      logger.warn('Profile update invalid lastName');
      throw new Error('invalid_lastName');
    }
    if (avatarUrl !== null && !isValidUrl(avatarUrl)) {
      logger.warn('Profile update invalid avatarUrl');
      throw new Error('invalid_avatar');
    }

    const saved = await this.repo.upsert(userId, { firstName, lastName, avatarUrl });
    logger.info('Profile updated', { userId });
    return this.toDTO(saved);
  }
}
