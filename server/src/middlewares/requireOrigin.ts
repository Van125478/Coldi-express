import type { RequestHandler } from "express";
import { getEnv } from "../config/env.js";
import { HttpError } from "./errorHandler.js";

export const requireTrustedOrigin: RequestHandler = (request, _response, next) => {
  const origin = request.get("origin");
  if (origin !== undefined && origin !== getEnv().FRONTEND_ORIGIN) {
    next(new HttpError(403, "invalid_origin", "Trình duyệt gửi yêu cầu từ một nguồn không được phép."));
    return;
  }
  next();
};
