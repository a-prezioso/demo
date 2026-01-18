// ProfileRepository - manages user profile basic fields (firstName, lastName, avatar)
// In-memory implementation suitable for development/testing. Real DB wiring can be added later.
// Do not log PII excessively; avoid logging full names in production logs.

export interface ProfileRecord {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null; // URL to avatar media (if upload is managed elsewhere)
  avatarId?: string | null; // Optional media ID reference (future use)
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileInput {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  avatarId?: string | null;
}

export interface IProfileRepository {
  getByUserId(userId: string): Promise<ProfileRecord | null>;
  upsert(userId: string, input: UpdateProfileInput): Promise<ProfileRecord>;
}

export class InMemoryProfileRepository implements IProfileRepository {
  private store = new Map<string, ProfileRecord>();

  async getByUserId(userId: string): Promise<ProfileRecord | null> {
    return this.store.get(userId) ?? null;
  }

  async upsert(userId: string, input: UpdateProfileInput): Promise<ProfileRecord> {
    const now = new Date();
    const existing = this.store.get(userId);
    if (!existing) {
      const created: ProfileRecord = {
        userId,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        avatarUrl: input.avatarUrl ?? null,
        avatarId: input.avatarId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.store.set(userId, created);
      return created;
    }
    const updated: ProfileRecord = {
      ...existing,
      firstName: input.firstName !== undefined ? input.firstName : existing.firstName ?? null,
      lastName: input.lastName !== undefined ? input.lastName : existing.lastName ?? null,
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : existing.avatarUrl ?? null,
      avatarId: input.avatarId !== undefined ? input.avatarId : existing.avatarId ?? null,
      updatedAt: now,
    };
    this.store.set(userId, updated);
    return updated;
  }

  // testing utility
  clearAll(): void {
    this.store.clear();
  }
}
