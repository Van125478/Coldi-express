import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import { Shipment } from "../models/shipment.js";
import { toCarrierShipmentDto } from "../shipments/shipmentDto.js";

const forbiddenFields = ["carrierId", "status", "shipperId", "vehicleId", "driverId", "role"] as const;

export const carrierShipmentRouter = Router();

carrierShipmentRouter.use(requireAuth, requireRole("CARRIER"));

carrierShipmentRouter.get("/", async (_request, response, next) => {
  try {
    const shipments = await Shipment.find({ status: "PUBLISHED" }).sort({ createdAt: 1, _id: 1 });
    response.status(200).json({ shipments: shipments.map((shipment) => toCarrierShipmentDto(shipment)) });
  } catch (error) {
    next(error);
  }
});

carrierShipmentRouter.post("/:id/claim", requireTrustedOrigin, async (request, response, next) => {
  try {
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");

    const body: unknown = request.body;
    if (typeof body === "object" && body !== null) {
      const present = forbiddenFields.filter((field) => field in (body as Record<string, unknown>));
      if (present.length > 0) {
        throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
      }
    }

    const id = request.params.id;
    if (typeof id !== "string" || !isValidObjectId(id)) {
      throw new HttpError(404, "not_found", "Không tìm thấy đơn.");
    }

    const shipment = await Shipment.findOneAndUpdate(
      {
        _id: id,
        status: "PUBLISHED",
        $or: [{ carrierId: { $exists: false } }, { carrierId: null }],
      },
      { $set: { status: "MATCHED", carrierId } },
      { returnDocument: "after" },
    );
    if (!shipment) {
      const existing = await Shipment.findById(id);
      if (!existing) throw new HttpError(404, "not_found", "Không tìm thấy đơn.");
      throw new HttpError(409, "conflict", "Đơn này đã có nhà xe nhận. Chuyến không còn mở.");
    }

    response.status(200).json({ shipment: toCarrierShipmentDto(shipment) });
  } catch (error) {
    next(error);
  }
});
