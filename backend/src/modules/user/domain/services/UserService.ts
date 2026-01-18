// UserService - business logic for user lifecycle (signup will use this later)
// Ensure sensitive data are never logged.

import { randomUUID } from 'crypto';
import { User } from '../entities/User';
import { IUserRepository } from '../../repository/UserRepository';
import { PasswordHasher } from '../../../core/security/passwordHasher';
import { normalizeEmail, validatePassword, isEmailValid } from '../../../core/security/validation';
import { logger } from '../../../core/logging/logger';

export class UserService {
  constructor(private readonly repo: IUserRepository, private readonly hasher: PasswordHasher) {}

  async register(email: string, plainPassword: string): Promise<User> {
    const normalizedEmail = normalizeEmail(email);

    // Validate email format
    if (!isEmailValid(normalizedEmail)) {
      logger.warn('Invalid email format during signup');
      throw new Error('Invalid email format');
    }

    // Validate password strength according to policy
    const pwdValidation = validatePassword(plainPassword);
    if (!pwdValidation.valid) {
      logger.warn('Password validation failed for signup', { reasons: pwdValidation.reasons.length });
      throw new Error('Password does not meet security requirements');
    }

    // Hash password
    const { hash, salt } = await this.hasher.hash(plainPassword);
    const user = User.createNew({ id: randomUUID(), email: normalizedEmail, passwordHash: hash, salt });
    return this.repo.create(user);
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(normalizeEmail(email));
  }
}
