import { randomUUID } from "node:crypto";
import { FleetCapacity } from "../models/package.js";
import { Vehicle } from "../models/vehicle.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { activeVehicleFilter } from "./vehicleStatus.js";

const limitMessage = "Đã đạt số xe hoạt động của gói hiện tại. Xe đã lưu trữ không tính vào hạn mức. Hãy lưu trữ xe không dùng hoặc đợi gói có hạn mức cao hơn.";
const holdTtlMs = 30_000;

/**
 * Reserves one ACTIVE slot with a short-lived hold on a single counter document.
 * A multi-document transaction is not used: this deployment does not assume a replica set.
 * activeCount is the committed ACTIVE vehicles. A hold is an in-flight reservation.
 * Usage is activeCount plus holds that are still inside the TTL.
 * Reconcile drops only expired holds, then rewrites activeCount when no hold remains.
 */
export async function reserveActiveVehicleSlot(carrierId: string, cap: number): Promise<string> {
  await reconcileFleetCapacity(carrierId);
  const token = randomUUID();
  const now = new Date();
  const freshAfter = new Date(now.getTime() - holdTtlMs);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reserved = await FleetCapacity.findOneAndUpdate(
      {
        carrierId,
        $expr: {
          $lt: [{ $add: ["$activeCount", freshHoldCount(freshAfter)] }, cap],
        },
      },
      { $push: { holds: { token, createdAt: now } } },
      { returnDocument: "after" },
    );
    if (reserved) return token;

    const existing = await FleetCapacity.findOne({ carrierId });
    if (existing) throw new HttpError(409, "plan_limit_exceeded", limitMessage);

    const activeCount = await Vehicle.countDocuments({ carrierId, ...activeVehicleFilter() });
    if (activeCount >= cap) throw new HttpError(409, "plan_limit_exceeded", limitMessage);
    try {
      await FleetCapacity.create({ carrierId, activeCount, holds: [{ token, createdAt: now }] });
      return token;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  throw new HttpError(409, "plan_limit_exceeded", "Không giữ được suất xe. Hãy thử lại.");
}

export async function commitActiveVehicleSlot(carrierId: string, token: string): Promise<void> {
  const committed = await FleetCapacity.findOneAndUpdate(
    { carrierId, "holds.token": token },
    { $pull: { holds: { token } }, $inc: { activeCount: 1 } },
  );
  if (!committed) await reconcileFleetCapacity(carrierId);
}

export async function releaseActiveVehicleReservation(carrierId: string, token: string): Promise<void> {
  await FleetCapacity.updateOne({ carrierId }, { $pull: { holds: { token } } });
}

export async function releaseCommittedVehicleSlot(carrierId: string): Promise<void> {
  await FleetCapacity.updateOne({ carrierId, activeCount: { $gt: 0 } }, { $inc: { activeCount: -1 } });
}

export async function reconcileFleetCapacity(carrierId: string, now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - holdTtlMs);
  await FleetCapacity.updateOne({ carrierId }, { $pull: { holds: { createdAt: { $lt: cutoff } } } });
  const doc = await FleetCapacity.findOne({ carrierId }).select("holds");
  if (!doc || (doc.holds?.length ?? 0) > 0) return;
  const actual = await Vehicle.countDocuments({ carrierId, ...activeVehicleFilter() });
  await FleetCapacity.updateOne({ carrierId, holds: { $size: 0 } }, { $set: { activeCount: actual } });
}

export async function reconcileAllFleetCapacities(): Promise<void> {
  const rows = await FleetCapacity.find().select("carrierId");
  for (const row of rows) {
    await reconcileFleetCapacity(row.carrierId.toString());
  }
}

function freshHoldCount(freshAfter: Date) {
  return {
    $size: {
      $filter: {
        input: { $ifNull: ["$holds", []] },
        as: "hold",
        cond: { $gte: ["$$hold.createdAt", freshAfter] },
      },
    },
  };
}

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
