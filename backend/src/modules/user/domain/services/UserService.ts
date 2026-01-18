// UserService - business logic for user lifecycle (signup will use this later)
// Ensure sensitive data are never logged.

import { randomUUID } from 'crypto';
import { User } from '../entities/User';
import { IUserRepository } from '../../repository/UserRepository';
import { PasswordHasher } from '../../../core/security/passwordHasher';

export class UserService {
  constructor(private readonly repo: IUserRepository, private readonly hasher: PasswordHasher) {}

  async register(email: string, plainPassword: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    // Hash password
    const { hash, salt } = await this.hasher.hash(plainPassword);
    const user = User.createNew({ id: randomUUID(), email: normalizedEmail, passwordHash: hash, salt });
    return this.repo.create(user);
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email.trim().toLowerCase());
  }
}
