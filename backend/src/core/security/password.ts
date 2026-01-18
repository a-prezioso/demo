// High-level password service exposing simple functions
// Uses ScryptPasswordHasher by default. No sensitive data should be logged.

import { ScryptPasswordHasher } from './passwordHasher';

const defaultHasher = new ScryptPasswordHasher();

export const hashPassword = async (plainPassword: string): Promise<{ hash: string; salt?: string | null }> => {
  return defaultHasher.hash(plainPassword);
};

export const verifyPassword = async (plainPassword: string, passwordHash: string, salt?: string | null): Promise<boolean> => {
  return defaultHasher.verify(plainPassword, passwordHash, salt);
};
