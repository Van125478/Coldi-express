import { Router } from "express";
import { clearSessionCookie, setSessionCookie } from "../auth/cookies.js";
import { verifyPassword } from "../auth/password.js";
import { signSessionToken } from "../auth/sessionToken.js";
import { toUserDto } from "../auth/userDto.js";
import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { User } from "../models/user.js";

const INVALID_CREDENTIALS = "Email hoặc mật khẩu không đúng.";

export const authRouter = Router();

authRouter.post("/login", requireTrustedOrigin, async (request, response, next) => {
  try {
    const body: unknown = request.body;
    if (typeof body !== "object" || body === null) {
      throw new HttpError(400, "invalid_request", "Nhập email và mật khẩu.");
    }
    const record = body as Record<string, unknown>;
    const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
    const password = typeof record.password === "string" ? record.password : "";
    if (email.length === 0 || password.length === 0 || !email.includes("@")) {
      throw new HttpError(400, "invalid_request", "Nhập email và mật khẩu.");
    }
    if (password.length > 72) {
      throw new HttpError(400, "invalid_request", "Mật khẩu không hợp lệ.");
    }

    const user = await User.findOne({ email });
    const matches = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !matches) {
      throw new HttpError(401, "invalid_credentials", INVALID_CREDENTIALS);
    }

    const token = await signSessionToken(user._id.toString(), getEnv().AUTH_SECRET);
    setSessionCookie(response, token);
    response.status(200).json({ user: toUserDto(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (request, response) => {
  response.status(200).json({ user: request.authUser });
});

authRouter.post("/logout", requireTrustedOrigin, (_request, response) => {
  clearSessionCookie(response);
  response.status(200).json({ ok: true });
});
