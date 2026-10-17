import type { RequestHandler } from "express";
import { HttpError } from "./errorHandler.js";

export const requireOperationalSession: RequestHandler = (request, _response, next) => {
  if (request.authUser?.mustChangePassword) {
    next(new HttpError(403, "password_change_required", "Cần đổi mật khẩu tạm trước khi tiếp tục."));
    return;
  }
  next();
};
