// Public facing DTO excluding sensitive fields

import { User } from "../domain/entities/User";

export interface UserDto {
  id: string;
  email: string;
  status: User["status"];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export function toUserDto(u: User): UserDto {
  return {
    id: u.id,
    email: u.email,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}
