import { Router } from "express";
import { readCorrelationId, recordSuccessfulAudit } from "../audit/recordAudit.js";
import { isValidObjectId } from "mongoose";
import { readDriverName, readVehicleInput, temperatureLabel, vehicleKindLabel } from "../fleet/vehicleInput.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import type { TemperatureGroup } from "../models/shipment.js";
import { User } from "../models/user.js";
import { Vehicle, type VehicleKind } from "../models/vehicle.js";

export const carrierFleetRouter = Router();

carrierFleetRouter.use(requireAuth, requireRole("CARRIER"));

carrierFleetRouter.get("/vehicles", async (request, response, next) => {
  try {
    const carrierId = carrier(request.authUser?.id);
    const vehicles = await Vehicle.find({ carrierId }).sort({ label: 1, _id: 1 });
    response.status(200).json({ vehicles: vehicles.map(toVehicleDto) });
  } catch (error) {
    next(error);
  }
});

carrierFleetRouter.post("/vehicles", requireTrustedOrigin, async (request, response, next) => {
  try {
    const carrierId = carrier(request.authUser?.id);
    const input = readVehicleInput(request.body);
    const vehicle = await Vehicle.create({ ...input, carrierId });
    await recordSuccessfulAudit({
      action: "VEHICLE_CREATED",
      actorId: carrierId,
      actorRole: "CARRIER",
      resourceType: "vehicle",
      resourceId: vehicle._id.toString(),
      relatedCarrierId: carrierId,
      fields: Object.keys(input),
      correlationId: readCorrelationId(request.headers["x-request-id"]),
    });
    response.status(201).json({ vehicle: toVehicleDto(vehicle) });
  } catch (error) {
    next(error);
  }
});

carrierFleetRouter.get("/vehicles/:id", async (request, response, next) => {
  try {
    const vehicle = await ownedVehicle(carrier(request.authUser?.id), request.params.id);
    response.status(200).json({ vehicle: toVehicleDto(vehicle) });
  } catch (error) {
    next(error);
  }
});

carrierFleetRouter.patch("/vehicles/:id", requireTrustedOrigin, async (request, response, next) => {
  try {
    const carrierId = carrier(request.authUser?.id);
    const input = readVehicleInput(request.body);
    const updated = await Vehicle.findOneAndUpdate({ _id: routeId(request.params.id), carrierId }, input, { returnDocument: "after" });
    if (!updated) throw new HttpError(404, "not_found", "Không tìm thấy xe này.");
    await recordSuccessfulAudit({
      action: "VEHICLE_UPDATED",
      actorId: carrierId,
      actorRole: "CARRIER",
      resourceType: "vehicle",
      resourceId: updated._id.toString(),
      relatedCarrierId: carrierId,
      fields: Object.keys(input),
      correlationId: readCorrelationId(request.headers["x-request-id"]),
    });
    response.status(200).json({ vehicle: toVehicleDto(updated) });
  } catch (error) {
    next(error);
  }
});

carrierFleetRouter.get("/drivers", async (request, response, next) => {
  try {
    const carrierId = carrier(request.authUser?.id);
    const drivers = await User.find({ role: "DRIVER", carrierId }).sort({ displayName: 1, _id: 1 }).select("displayName");
    response.status(200).json({ drivers: drivers.map(toDriverDto) });
  } catch (error) {
    next(error);
  }
});

carrierFleetRouter.get("/drivers/:id", async (request, response, next) => {
  try {
    const driver = await linkedDriver(carrier(request.authUser?.id), request.params.id);
    response.status(200).json({ driver: toDriverDto(driver) });
  } catch (error) {
    next(error);
  }
});

carrierFleetRouter.patch("/drivers/:id", requireTrustedOrigin, async (request, response, next) => {
  try {
    const carrierId = carrier(request.authUser?.id);
    const displayName = readDriverName(request.body);
    const updated = await User.findOneAndUpdate(
      { _id: routeId(request.params.id), role: "DRIVER", carrierId },
      { displayName },
      { returnDocument: "after" },
    ).select("displayName");
    if (!updated) throw new HttpError(404, "not_found", "Không tìm thấy tài xế này.");
    await recordSuccessfulAudit({
      action: "DRIVER_PROFILE_UPDATED",
      actorId: carrierId,
      actorRole: "CARRIER",
      resourceType: "driver",
      resourceId: updated._id.toString(),
      relatedCarrierId: carrierId,
      fields: ["displayName"],
      correlationId: readCorrelationId(request.headers["x-request-id"]),
    });
    response.status(200).json({ driver: toDriverDto(updated) });
  } catch (error) {
    next(error);
  }
});

function carrier(id: string | undefined): string {
  if (!id) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
  return id;
}

function routeId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id || !isValidObjectId(id)) throw new HttpError(404, "not_found", "Không tìm thấy hồ sơ này.");
  return id;
}

async function ownedVehicle(carrierId: string, rawId: string | string[] | undefined) {
  const vehicle = await Vehicle.findOne({ _id: routeId(rawId), carrierId });
  if (!vehicle) throw new HttpError(404, "not_found", "Không tìm thấy xe này.");
  return vehicle;
}

async function linkedDriver(carrierId: string, rawId: string | string[] | undefined) {
  const driver = await User.findOne({ _id: routeId(rawId), role: "DRIVER", carrierId }).select("displayName");
  if (!driver) throw new HttpError(404, "not_found", "Không tìm thấy tài xế này.");
  return driver;
}

function toVehicleDto(vehicle: {
  _id: { toString(): string };
  label: string;
  plate?: string | null;
  vehicleKind?: VehicleKind | null;
  temperatureGroup?: TemperatureGroup | null;
  capacityTon?: number | null;
}) {
  return {
    id: vehicle._id.toString(),
    label: vehicle.label,
    plate: vehicle.plate ?? null,
    vehicleKind: vehicle.vehicleKind ?? null,
    vehicleKindLabel: vehicleKindLabel(vehicle.vehicleKind),
    temperatureGroup: vehicle.temperatureGroup ?? null,
    temperatureLabel: temperatureLabel(vehicle.temperatureGroup),
    capacityTon: vehicle.capacityTon ?? null,
  };
}

function toDriverDto(driver: { _id: { toString(): string }; displayName?: string | null }) {
  const displayName = driver.displayName?.trim() || null;
  return { id: driver._id.toString(), displayName };
}
