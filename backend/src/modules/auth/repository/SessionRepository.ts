// SessionRepository - manages refresh token sessions (in-memory implementation)
// Stores only hashed refresh tokens. Do NOT log tokens or hashes.

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  revokedBy?: string | null;
  revokedReason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fingerprint?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  issuedAt?: Date;
  expiresAt: Date;
  ip?: string | null;
  userAgent?: string | null;
  fingerprint?: string | null;
}

export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<SessionRecord>;
  findByTokenHash(hash: string): Promise<SessionRecord | null>;
  findAllByUserId(userId: string): Promise<SessionRecord[]>;
  revokeByTokenHash(hash: string, meta?: { by?: string; reason?: string }): Promise<boolean>;
  revokeAllForUser(userId: string, meta?: { by?: string; reason?: string }): Promise<number>; // returns count
  cleanupExpired(now?: Date): Promise<number>; // delete or mark expired sessions, returns count affected
}

// Simple in-memory implementation for development/testing
export class InMemorySessionRepository implements ISessionRepository {
  private byHash = new Map<string, SessionRecord>();
  private byUser = new Map<string, Set<string>>();

  async create(input: CreateSessionInput): Promise<SessionRecord> {
    const now = new Date();
    const rec: SessionRecord = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      issuedAt: input.issuedAt || now,
      expiresAt: input.expiresAt,
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      fingerprint: input.fingerprint ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.byHash.set(rec.refreshTokenHash, rec);
    const set = this.byUser.get(rec.userId) || new Set<string>();
    set.add(rec.refreshTokenHash);
    this.byUser.set(rec.userId, set);
    return rec;
  }

  async findByTokenHash(hash: string): Promise<SessionRecord | null> {
    return this.byHash.get(hash) || null;
  }

  async findAllByUserId(userId: string): Promise<SessionRecord[]> {
    const set = this.byUser.get(userId);
    if (!set) return [];
    const list: SessionRecord[] = [];
    for (const hash of set) {
      const rec = this.byHash.get(hash);
      if (rec) list.push(rec);
    }
    return list;
  }

  async revokeByTokenHash(hash: string, meta?: { by?: string; reason?: string }): Promise<boolean> {
    const rec = this.byHash.get(hash);
    if (!rec) return false;
    if (rec.revokedAt) return true;
    rec.revokedAt = new Date();
    rec.revokedBy = meta?.by ?? null;
    rec.revokedReason = meta?.reason ?? null;
    rec.updatedAt = new Date();
    return true;
  }

  async revokeAllForUser(userId: string, meta?: { by?: string; reason?: string }): Promise<number> {
    const set = this.byUser.get(userId);
    if (!set) return 0;
    let count = 0;
    for (const hash of set) {
      const rec = this.byHash.get(hash);
      if (rec && !rec.revokedAt) {
        rec.revokedAt = new Date();
        rec.revokedBy = meta?.by ?? null;
        rec.revokedReason = meta?.reason ?? null;
        rec.updatedAt = new Date();
        count++;
      }
    }
    return count;
  }

  async cleanupExpired(now: Date = new Date()): Promise<number> {
    let count = 0;
    for (const [hash, rec] of this.byHash.entries()) {
      if (now >= rec.expiresAt) {
        // Remove from maps
        this.byHash.delete(hash);
        const set = this.byUser.get(rec.userId);
        if (set) {
          set.delete(hash);
          if (set.size === 0) this.byUser.delete(rec.userId);
        }
        count++;
      }
    }
    return count;
  }
}
