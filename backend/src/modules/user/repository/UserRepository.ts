// Repository for User persistence using Prisma ORM
// Follows repository pattern described in docs/source-tree.md

import { PrismaClient, User as UserModel, UserStatus } from "@prisma/client";
import { User } from "../domain/entities/User";

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        passwordSalt: data.passwordSalt ?? null,
        verificationToken: data.verificationToken ?? null,
        verificationExpiresAt: data.verificationExpiresAt ?? null,
        status: (data.status as unknown as UserStatus) ?? "ACTIVE",
      },
    });
    return this.mapToDomain(created);
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return found ? this.mapToDomain(found) : null;
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { id } });
    return found ? this.mapToDomain(found) : null;
  }

  async updatePassword(id: string, passwordHash: string, passwordSalt?: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, passwordSalt: passwordSalt ?? null },
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { status } });
  }

  async setVerification(id: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { verificationToken: token, verificationExpiresAt: expiresAt },
    });
  }

  async clearVerification(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { verificationToken: null, verificationExpiresAt: null },
    });
  }

  private mapToDomain(model: UserModel): User {
    return {
      id: model.id,
      email: model.email,
      passwordHash: model.passwordHash,
      passwordSalt: model.passwordSalt,
      verificationToken: model.verificationToken,
      verificationExpiresAt: model.verificationExpiresAt,
      status: model.status as unknown as User["status"],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
