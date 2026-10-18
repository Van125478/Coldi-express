import type { AccountStatus, UserRole } from "../models/user.js";

export type UserDto = {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
};

export function toUserDto(user: {
  _id: { toString(): string };
  email?: string | null;
  username?: string | null;
  role: string;
  accountStatus?: string | null;
  mustChangePassword?: boolean | null;
}): UserDto {
  return {
    id: user._id.toString(),
    email: user.email ?? "",
    username: user.username ?? null,
    role: user.role as UserRole,
    accountStatus: user.accountStatus === "LOCKED" ? "LOCKED" : "ACTIVE",
    mustChangePassword: user.mustChangePassword === true,
  };
}
