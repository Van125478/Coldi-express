import { Router } from "express";
import express from "express";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireOperationalSession } from "../middlewares/requireOperational.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import { CARGO_IMAGE_LIMITS, deleteUnattachedCargoImage, readCargoBytes, storeCargoUpload } from "../shipments/cargoImages.js";

export const cargoImageRouter = Router();

cargoImageRouter.use(requireAuth, requireOperationalSession);

cargoImageRouter.post(
  "/",
  requireTrustedOrigin,
  requireRole("SHIPPER"),
  express.raw({ type: [...CARGO_IMAGE_LIMITS.formats], limit: CARGO_IMAGE_LIMITS.maxBytes }),
  async (request, response, next) => {
    try {
      const ownerId = request.authUser?.id;
      if (!ownerId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
      if (!Buffer.isBuffer(request.body)) {
        throw new HttpError(400, "invalid_request", "Ảnh hàng hóa chỉ nhận JPG, PNG hoặc WebP.", { cargoImages: "Ảnh hàng hóa chỉ nhận JPG, PNG hoặc WebP." });
      }
      const declared = request.header("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
      const image = await storeCargoUpload(ownerId, declared, request.body);
      response.status(201).json({ image });
    } catch (error) {
      next(error);
    }
  },
);

cargoImageRouter.get("/:id", async (request, response, next) => {
  try {
    const userId = request.authUser?.id;
    const role = request.authUser?.role;
    if (!userId || !role) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const imageId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    if (!imageId) throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
    const file = await readCargoBytes(imageId, userId, role);
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Disposition", "inline; filename=\"hang-hoa\"");
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.status(200).send(file.bytes);
  } catch (error) {
    next(error);
  }
});

cargoImageRouter.delete("/:id", requireTrustedOrigin, requireRole("SHIPPER"), async (request, response, next) => {
  try {
    const ownerId = request.authUser?.id;
    if (!ownerId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const imageId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    if (!imageId) throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
    await deleteUnattachedCargoImage(imageId, ownerId);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
