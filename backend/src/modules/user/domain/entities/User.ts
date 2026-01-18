// Domain entity for User, mapped to DB via Prisma schema
// Note: do not log sensitive fields (passwordHash, salt, verificationToken)

export type AccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DISABLED';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string; // never log
  salt?: string | null; // never log
  status: AccountStatus;
  verificationToken?: string | null; // never log
  verificationExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User implements UserProps {
  id: string;
  email: string;
  passwordHash: string;
  salt?: string | null;
  status: AccountStatus;
  verificationToken?: string | null;
  verificationExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.salt = props.salt ?? null;
    this.status = props.status;
    this.verificationToken = props.verificationToken ?? null;
    this.verificationExpiresAt = props.verificationExpiresAt ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static createNew(params: { id: string; email: string; passwordHash: string; salt?: string | null; status?: AccountStatus; }): User {
    const now = new Date();
    return new User({
      id: params.id,
      email: params.email.toLowerCase().trim(),
      passwordHash: params.passwordHash,
      salt: params.salt ?? null,
      status: params.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      verificationToken: null,
      verificationExpiresAt: null,
    });
  }
}
