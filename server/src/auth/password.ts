import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { HttpError } from "../middlewares/errorHandler.js";

const COST = 12;
const TEMPORARY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function assertAcceptablePassword(password: string): void {
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new HttpError(400, "invalid_request", "Mật khẩu cần từ 8 đến 72 ký tự.");
  }
}

export function generateTemporaryPassword(): string {
  let password = "";
  for (let index = 0; index < 20; index += 1) {
    password += TEMPORARY_ALPHABET[randomInt(TEMPORARY_ALPHABET.length)];
  }
  return password;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
