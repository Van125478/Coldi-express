import type { RequestHandler } from "express";
import type { UserRole } from "../models/user.js";
import { HttpError } from "./errorHandler.js";

export function requireRole(...roles: readonly UserRole[]): RequestHandler {
  return (request, _response, next) => {
    const user = request.authUser;
    if (!user) {
      next(new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục."));
      return;
    }
    if (!roles.includes(user.role)) {
      next(new HttpError(403, "forbidden", "Tài khoản này không có quyền thực hiện thao tác."));
      return;
    }
    next();
  };
}
