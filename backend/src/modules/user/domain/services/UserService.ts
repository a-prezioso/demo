// UserService encapsulates business logic for user lifecycle
// It does not log sensitive info such as passwords or tokens.

import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { User, UserStatus } from "../entities/User";
import { UserRepository } from "../../repository/UserRepository";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  passwordSalt?: string | null;
  requireEmailVerification?: boolean;
}

export class UserService {
  private readonly repo: UserRepository;

  constructor(prisma: PrismaClient) {
    this.repo = new UserRepository(prisma);
  }

  async register(input: CreateUserInput): Promise<User> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw new Error("EMAIL_ALREADY_IN_USE");
    }

    const base: Omit<User, "id" | "createdAt" | "updatedAt"> = {
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      passwordSalt: input.passwordSalt ?? null,
      verificationToken: null,
      verificationExpiresAt: null,
      status: "ACTIVE",
    };

    if (input.requireEmailVerification) {
      const token = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
      base.verificationToken = token;
      base.verificationExpiresAt = expiresAt;
      base.status = "PENDING" as UserStatus;
    }

    return this.repo.create(base);
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString("hex");
  }
}
