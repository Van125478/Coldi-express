import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import { Shipment } from "../models/shipment.js";
import { readPublishInput } from "../shipments/publishInput.js";
import { toShipmentDto } from "../shipments/shipmentDto.js";

export const shipmentRouter = Router();

shipmentRouter.use(requireAuth, requireRole("SHIPPER"));

shipmentRouter.post("/", requireTrustedOrigin, async (request, response, next) => {
  try {
    const input = readPublishInput(request.body);
    const shipperId = request.authUser?.id;
    if (!shipperId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const shipment = await Shipment.create({
      ...input,
      shipperId,
      status: "PUBLISHED",
    });
    response.status(201).json({ shipment: toShipmentDto(shipment) });
  } catch (error) {
    next(error);
  }
});

shipmentRouter.get("/mine", async (request, response, next) => {
  try {
    const shipperId = request.authUser?.id;
    if (!shipperId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const shipments = await Shipment.find({ shipperId }).sort({ createdAt: -1 });
    response.status(200).json({ shipments: shipments.map((shipment) => toShipmentDto(shipment)) });
  } catch (error) {
    next(error);
  }
});

shipmentRouter.get("/:id", async (request, response, next) => {
  try {
    const id = request.params.id;
    if (typeof id !== "string" || !isValidObjectId(id)) {
      throw new HttpError(404, "not_found", "Không tìm thấy đơn.");
    }
    const shipment = await Shipment.findById(id);
    if (!shipment) throw new HttpError(404, "not_found", "Không tìm thấy đơn.");
    if (shipment.shipperId.toString() !== request.authUser?.id) {
      throw new HttpError(403, "forbidden", "Tài khoản này không có quyền xem đơn.");
    }
    response.status(200).json({ shipment: toShipmentDto(shipment) });
  } catch (error) {
    next(error);
  }
});
