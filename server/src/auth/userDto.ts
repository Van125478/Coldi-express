import type { UserRole } from "../models/user.js";

export type UserDto = {
  id: string;
  email: string;
  role: UserRole;
};

export function toUserDto(user: { _id: { toString(): string }; email: string; role: string }): UserDto {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role as UserRole,
  };
}
