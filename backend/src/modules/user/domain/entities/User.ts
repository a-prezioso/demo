// Domain Entity: User
// NOTE: Keep this entity free of persistence-specific details.
// Mapping to DB is handled in repository layer.

export type UserStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DISABLED"
  | "DELETED";

export interface User {
  id: string; // UUID
  email: string; // lowercased, unique

  // Security-sensitive
  passwordHash: string;
  // If hashing library embeds the salt (e.g., bcrypt/argon2), this may be null
  passwordSalt?: string | null;

  // Email verification (optional lifecycle)
  verificationToken?: string | null;
  verificationExpiresAt?: Date | null;

  status: UserStatus;

  createdAt: Date;
  updatedAt: Date;
}
