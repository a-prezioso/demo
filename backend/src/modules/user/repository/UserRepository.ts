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
