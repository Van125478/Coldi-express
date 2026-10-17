import type { RequestHandler } from "express";
import { readCookie, SESSION_COOKIE, clearSessionCookie } from "../auth/cookies.js";
import { readSession } from "../auth/sessionToken.js";
import { toUserDto } from "../auth/userDto.js";
import { getEnv } from "../config/env.js";
import { User } from "../models/user.js";
import { HttpError } from "./errorHandler.js";

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    if (!token) {
      next(new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục."));
      return;
    }

    const session = await readSession(token, getEnv().AUTH_SECRET);
    if (!session) {
      clearSessionCookie(response);
      next(new HttpError(401, "unauthenticated", "Phiên đăng nhập không còn hiệu lực."));
      return;
    }

    const user = await User.findById(session.userId);
    if (!user || (user.sessionVersion ?? 0) !== session.sessionVersion) {
      clearSessionCookie(response);
      next(new HttpError(401, "unauthenticated", "Phiên đăng nhập không còn hiệu lực."));
      return;
    }
    if (user.accountStatus === "LOCKED") {
      clearSessionCookie(response);
      next(new HttpError(401, "account_locked", "Tài khoản đã bị khóa."));
      return;
    }

    request.authUser = toUserDto(user);
    next();
  } catch (error) {
    next(error);
  }
};
