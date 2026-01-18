// passwordHasher - centralizes password hashing policy.
// This is a placeholder; actual implementation will use bcrypt or argon2.
// Never log raw password, hash, or salt.

export interface PasswordHasher {
  hash(plain: string): Promise<{ hash: string; salt?: string | null }>;
  verify(plain: string, hash: string, salt?: string | null): Promise<boolean>;
}

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<{ hash: string; salt?: string | null }> {
    // TODO: implement with bcrypt; bcrypt embeds salt in hash string
    // return { hash: await bcrypt.hash(plain, 12) };
    return { hash: `__hash_placeholder__:${plain.length}` };
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    // TODO: implement with bcrypt.compare(plain, hash)
    return hash.startsWith('__hash_placeholder__:') && hash.endsWith(String(plain.length));
  }
}
