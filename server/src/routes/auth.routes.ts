import { Router } from "express";
import { clearSessionCookie, setSessionCookie } from "../auth/cookies.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signSessionToken } from "../auth/sessionToken.js";
import { toUserDto } from "../auth/userDto.js";
import { getEnv } from "../config/env.js";
import { assertReplacementPassword } from "../fleet/driverAccount.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { User } from "../models/user.js";

const INVALID_CREDENTIALS = "Email, tên đăng nhập hoặc mật khẩu không đúng.";

export const authRouter = Router();

authRouter.post("/login", requireTrustedOrigin, async (request, response, next) => {
  try {
    const body: unknown = request.body;
    if (typeof body !== "object" || body === null) {
      throw new HttpError(400, "invalid_request", "Nhập email hoặc tên đăng nhập và mật khẩu.");
    }
    const record = body as Record<string, unknown>;
    const identifier = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
    const password = typeof record.password === "string" ? record.password : "";
    if (identifier.length === 0 || password.length === 0) {
      throw new HttpError(400, "invalid_request", "Nhập email hoặc tên đăng nhập và mật khẩu.");
    }
    if (password.length > 72) {
      throw new HttpError(400, "invalid_request", "Mật khẩu không hợp lệ.");
    }

    const user = identifier.includes("@")
      ? await User.findOne({ email: identifier })
      : await User.findOne({ username: identifier, role: "DRIVER" });
    const matches = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !matches) {
      throw new HttpError(401, "invalid_credentials", INVALID_CREDENTIALS);
    }
    if (user.accountStatus === "LOCKED") {
      throw new HttpError(403, "account_locked", "Tài khoản đã bị khóa.");
    }

    const token = await signSessionToken(user._id.toString(), getEnv().AUTH_SECRET, user.sessionVersion ?? 0);
    setSessionCookie(response, token);
    response.status(200).json({ user: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (request, response) => {
  response.status(200).json({ user: request.authUser });
});

authRouter.post("/change-required-password", requireTrustedOrigin, requireAuth, async (request, response, next) => {
  try {
    if (!request.authUser?.mustChangePassword) {
      throw new HttpError(409, "conflict", "Tài khoản không cần đổi mật khẩu.");
    }
    const body: unknown = request.body;
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new HttpError(400, "invalid_request", "Mật khẩu cần từ 8 đến 72 ký tự.");
    }
    const record = body as Record<string, unknown>;
    if (Object.keys(record).some((key) => key !== "newPassword")) {
      throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
    }
    const newPassword = assertReplacementPassword(record.newPassword);
    const passwordHash = await hashPassword(newPassword);
    const updated = await User.findOneAndUpdate(
      { _id: request.authUser.id, mustChangePassword: true, accountStatus: { $ne: "LOCKED" } },
      { $set: { passwordHash, mustChangePassword: false }, $inc: { sessionVersion: 1 } },
      { returnDocument: "after" },
    );
    if (!updated) throw new HttpError(409, "conflict", "Không đổi được mật khẩu tạm.");
    const token = await signSessionToken(updated._id.toString(), getEnv().AUTH_SECRET, updated.sessionVersion ?? 0);
    setSessionCookie(response, token);
    response.status(200).json({ user: toUserDto(updated) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", requireTrustedOrigin, (_request, response) => {
  clearSessionCookie(response);
  response.status(200).json({ ok: true });
});
