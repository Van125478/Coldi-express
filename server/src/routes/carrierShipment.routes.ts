import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import { Shipment } from "../models/shipment.js";
import { User } from "../models/user.js";
import { Vehicle } from "../models/vehicle.js";
import { readAssignInput } from "../shipments/assignInput.js";
import { toCarrierShipmentView, toCarrierShipmentViews } from "../shipments/assignmentView.js";
import { toCarrierShipmentDto } from "../shipments/shipmentDto.js";

const forbiddenFields = ["carrierId", "status", "shipperId", "vehicleId", "driverId", "role"] as const;

export const carrierShipmentRouter = Router();

carrierShipmentRouter.use(requireAuth, requireRole("CARRIER"));

carrierShipmentRouter.get("/", async (_request, response, next) => {
  try {
    const shipments = await Shipment.find({ status: "PUBLISHED" }).sort({ createdAt: 1, _id: 1 });
    response.status(200).json({ shipments: await toCarrierShipmentViews(shipments) });
  } catch (error) {
    next(error);
  }
});

carrierShipmentRouter.get("/claimed", async (request, response, next) => {
  try {
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const shipments = await Shipment.find({ carrierId, status: "MATCHED" }).sort({ createdAt: 1, _id: 1 });
    response.status(200).json({ shipments: await toCarrierShipmentViews(shipments) });
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

carrierShipmentRouter.post("/:id/assign", requireTrustedOrigin, async (request, response, next) => {
  try {
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const input = readAssignInput(request.body);
    const id = request.params.id;
    if (typeof id !== "string" || !isValidObjectId(id)) {
      throw new HttpError(404, "not_found", "Không tìm thấy đơn.");
    }

    const [vehicle, driver] = await Promise.all([
      Vehicle.findOne({ _id: input.vehicleId, carrierId }).select("label"),
      User.findOne({ _id: input.driverId, role: "DRIVER", carrierId }).select("displayName"),
    ]);
    if (!vehicle || !driver) {
      throw new HttpError(400, "invalid_request", "Xe hoặc tài xế không thuộc nhà xe này.");
    }

    const shipment = await Shipment.findOneAndUpdate(
      {
        _id: id,
        carrierId,
        status: "MATCHED",
        $and: [
          { $or: [{ vehicleId: { $exists: false } }, { vehicleId: null }] },
          { $or: [{ driverId: { $exists: false } }, { driverId: null }] },
        ],
      },
      { $set: { vehicleId: input.vehicleId, driverId: input.driverId } },
      { returnDocument: "after" },
    );
    if (!shipment) {
      const existing = await Shipment.findById(id);
      if (!existing) throw new HttpError(404, "not_found", "Không tìm thấy đơn.");
      if (existing.carrierId?.toString() !== carrierId) {
        throw new HttpError(403, "forbidden", "Nhà xe này không phụ trách chuyến.");
      }
      if (existing.vehicleId || existing.driverId) {
        throw new HttpError(409, "conflict", "Chuyến này đã được phân công.");
      }
      throw new HttpError(409, "conflict", "Chuyến chưa sẵn sàng để phân công.");
    }

    response.status(200).json({ shipment: await toCarrierShipmentView(shipment) });
  } catch (error) {
    next(error);
  }
});
