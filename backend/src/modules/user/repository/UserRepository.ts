// UserRepository - data access abstraction for User
// This is a placeholder aligned with Source Tree. Actual DB client wiring (Prisma) will be added later.
// Ensure sensitive fields are not logged.

import { User } from '../domain/entities/User';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export class UserRepository implements IUserRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(user: User): Promise<User> {
    // TODO: implement with Prisma client
    // NEVER log user.passwordHash, user.salt, user.verificationToken
    return Promise.resolve(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    // TODO: implement with Prisma client
    return Promise.resolve(null);
  }

  async findById(id: string): Promise<User | null> {
    // TODO: implement with Prisma client
    return Promise.resolve(null);
  }
}

// Error thrown by repository implementations when unique email violation occurs
export class DuplicateEmailError extends Error {
  constructor(message = 'Email already exists') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

// In-memory repository implementation for development/testing purposes
// Provides uniqueness checks and simulates race-condition protection at the repository level.
export class InMemoryUserRepository implements IUserRepository {
  private byId: Map<string, User> = new Map();
  private byEmail: Map<string, string> = new Map(); // email -> id
  private failCreateOnce = false; // testing hook: next create fails simulating DB error

  async create(user: User): Promise<User> {
    if (this.failCreateOnce) {
      // reset the flag and throw to simulate DB failure
      this.failCreateOnce = false;
      throw new Error('Simulated repository failure');
    }
    const emailKey = user.email.toLowerCase();
    if (this.byEmail.has(emailKey)) {
      throw new DuplicateEmailError();
    }
    this.byId.set(user.id, user);
    this.byEmail.set(emailKey, user.id);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const emailKey = email.toLowerCase();
    const id = this.byEmail.get(emailKey);
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  // Testing utilities (no-op in production)
  // Clears all stored users for clean test isolation
  clearAll(): void {
    this.byId.clear();
    this.byEmail.clear();
  }

  // Returns current number of stored users
  count(): number {
    return this.byId.size;
  }

  // Make the next create() call fail simulating a DB error
  failNextCreate(): void {
    this.failCreateOnce = true;
  }
}
