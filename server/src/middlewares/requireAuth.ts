import type { RequestHandler } from "express";
import { readCookie, SESSION_COOKIE, clearSessionCookie } from "../auth/cookies.js";
import { readSessionSubject } from "../auth/sessionToken.js";
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

    const userId = await readSessionSubject(token, getEnv().AUTH_SECRET);
    if (!userId) {
      clearSessionCookie(response);
      next(new HttpError(401, "unauthenticated", "Phiên đăng nhập không còn hiệu lực."));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      clearSessionCookie(response);
      next(new HttpError(401, "unauthenticated", "Phiên đăng nhập không còn hiệu lực."));
      return;
    }

    request.authUser = toUserDto(user);
    next();
  } catch (error) {
    next(error);
  }
};
