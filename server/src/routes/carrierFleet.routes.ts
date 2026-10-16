import { Router } from "express";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { User } from "../models/user.js";
import { Vehicle } from "../models/vehicle.js";

export const carrierFleetRouter = Router();

carrierFleetRouter.use(requireAuth, requireRole("CARRIER"));

carrierFleetRouter.get("/vehicles", async (request, response, next) => {
  try {
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const vehicles = await Vehicle.find({ carrierId }).sort({ label: 1, _id: 1 }).select("label");
    response.status(200).json({
      vehicles: vehicles.map((vehicle) => ({ id: vehicle._id.toString(), label: vehicle.label })),
    });
  } catch (error) {
    next(error);
  }
});

carrierFleetRouter.get("/drivers", async (request, response, next) => {
  try {
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const drivers = await User.find({ role: "DRIVER", carrierId }).sort({ displayName: 1, _id: 1 }).select("displayName");
    response.status(200).json({
      drivers: drivers.map((driver) => ({
        id: driver._id.toString(),
        displayName: driver.displayName?.trim() || null,
      })),
    });
  } catch (error) {
    next(error);
  }
});
