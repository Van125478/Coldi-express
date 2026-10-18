import { FleetCapacity } from "../models/package.js";
import { Vehicle } from "../models/vehicle.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { activeVehicleFilter } from "./vehicleStatus.js";

const limitMessage = "Đã đạt số xe hoạt động của gói hiện tại. Xe đã lưu trữ không tính vào hạn mức. Hãy lưu trữ xe không dùng hoặc đợi gói có hạn mức cao hơn.";

/**
 * Reserves one ACTIVE slot with an atomic counter update.
 * A multi-document transaction is not used: this deployment does not assume a replica set.
 * The counter update itself is atomic. The vehicle write happens afterward and releases the slot if it fails.
 */
export async function reserveActiveVehicleSlot(carrierId: string, cap: number): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reserved = await FleetCapacity.findOneAndUpdate(
      { carrierId, activeCount: { $lt: cap } },
      { $inc: { activeCount: 1 } },
      { returnDocument: "after" },
    );
    if (reserved) return;

    const existing = await FleetCapacity.findOne({ carrierId });
    if (existing) throw new HttpError(409, "plan_limit_exceeded", limitMessage);

    const activeCount = await Vehicle.countDocuments({ carrierId, ...activeVehicleFilter() });
    if (activeCount >= cap) throw new HttpError(409, "plan_limit_exceeded", limitMessage);
    try {
      await FleetCapacity.create({ carrierId, activeCount: activeCount + 1 });
      return;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  throw new HttpError(409, "plan_limit_exceeded", "Không giữ được suất xe. Hãy thử lại.");
}

export async function releaseActiveVehicleSlot(carrierId: string): Promise<void> {
  await FleetCapacity.updateOne({ carrierId, activeCount: { $gt: 0 } }, { $inc: { activeCount: -1 } });
}

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
