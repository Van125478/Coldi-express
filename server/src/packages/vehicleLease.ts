import { Types } from "mongoose";
import { Shipment } from "../models/shipment.js";
import { Vehicle } from "../models/vehicle.js";
import { unfinishedShipmentStatuses } from "./vehicleStatus.js";

export const vehicleBusyMessage =
  "Xe này đang gắn với một chuyến chưa hoàn thành. Hãy chọn xe khác hoặc đợi chuyến đó kết thúc.";

export const leaseGraceMs = 30_000;

const unfinished = new Set<string>(unfinishedShipmentStatuses);
const terminal = new Set(["DELIVERY_CONFIRMED", "COMPLETED", "CANCELLED"]);

export type LeaseConflict = {
  vehicleId: string;
  shipmentIds: string[];
};

type LeaseSnapshot = {
  status: string;
  vehicleId?: { toString(): string } | null;
};

/**
 * One ACTIVE vehicle may hold one unfinished shipment.
 * The winning request is the findOneAndUpdate whose filter still sees an empty lease,
 * or the same single shipment id on a retry. A second shipment id does not match.
 * A legacy array with more than one id also does not match, so it is left unchanged.
 */
export async function reserveVehicleForShipment(carrierId: string, vehicleId: string, shipmentId: string) {
  const acquired = await tryReserve(carrierId, vehicleId, shipmentId);
  if (acquired) return acquired;
  await releaseStrandedLeases(carrierId, vehicleId);
  return tryReserve(carrierId, vehicleId, shipmentId);
}

export async function releaseVehicleReservation(carrierId: string, vehicleId: string, shipmentId: string): Promise<void> {
  if (!Types.ObjectId.isValid(shipmentId)) return;
  const updated = await Vehicle.findOneAndUpdate(
    { _id: vehicleId, carrierId },
    { $pull: { leasedShipmentIds: new Types.ObjectId(shipmentId) } },
    { returnDocument: "after" },
  );
  if (!updated || (updated.leasedShipmentIds?.length ?? 0) > 0) return;
  await Vehicle.updateOne(
    {
      _id: vehicleId,
      carrierId,
      $or: [{ leasedShipmentIds: { $exists: false } }, { leasedShipmentIds: null }, { leasedShipmentIds: { $size: 0 } }],
    },
    { $unset: { leaseAcquiredAt: "" } },
  );
}

export async function findExclusiveAssignmentConflicts(): Promise<LeaseConflict[]> {
  const pointed = await conflictsFromVehicleField();
  const leased = await conflictsFromLeaseArray();
  return mergeConflicts([...pointed, ...leased]);
}

export async function reconcileVehicleLeases(now = new Date()): Promise<{ released: number; conflicts: LeaseConflict[] }> {
  const conflicts = await findExclusiveAssignmentConflicts();
  if (conflicts.length > 0) {
    console.error(`Vehicle assignment conflicts left unchanged: ${JSON.stringify(conflicts)}`);
  }
  const blocked = new Set(conflicts.map((conflict) => conflict.vehicleId));
  const vehicles = await Vehicle.find({ "leasedShipmentIds.0": { $exists: true } }).select("_id carrierId");
  let released = 0;
  for (const vehicle of vehicles) {
    const vehicleId = vehicle._id.toString();
    if (blocked.has(vehicleId)) continue;
    released += await releaseStrandedLeases(vehicle.carrierId.toString(), vehicleId, now);
  }
  return { released, conflicts };
}

async function tryReserve(carrierId: string, vehicleId: string, shipmentId: string) {
  if (!Types.ObjectId.isValid(vehicleId) || !Types.ObjectId.isValid(shipmentId)) return null;
  const shipmentObjectId = new Types.ObjectId(shipmentId);
  return Vehicle.findOneAndUpdate(
    {
      _id: vehicleId,
      carrierId,
      status: { $ne: "ARCHIVED" },
      $or: [
        { leasedShipmentIds: { $exists: false } },
        { leasedShipmentIds: null },
        { leasedShipmentIds: { $size: 0 } },
        { leasedShipmentIds: { $eq: [shipmentObjectId] } },
      ],
    },
    { $set: { leasedShipmentIds: [shipmentObjectId], leaseAcquiredAt: new Date() } },
    { returnDocument: "after" },
  );
}

async function releaseStrandedLeases(carrierId: string, vehicleId: string, now = new Date()): Promise<number> {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, carrierId }).select("leasedShipmentIds leaseAcquiredAt");
  const leaseIds = (vehicle?.leasedShipmentIds ?? []).map((id) => id.toString());
  if (leaseIds.length === 0) return 0;
  const shipments = await Shipment.find({ _id: { $in: leaseIds } }).select("status vehicleId");
  const unfinishedLeased = shipments.filter((shipment) => unfinished.has(shipment.status));
  const pointing = await Shipment.countDocuments({ vehicleId, status: { $in: [...unfinishedShipmentStatuses] } });
  if (pointing > 1 || unfinishedLeased.length > 1) return 0;

  let released = 0;
  for (const shipmentId of leaseIds) {
    const shipment = shipments.find((item) => item._id.toString() === shipmentId);
    if (!leaseIsStranded(shipment, vehicleId, vehicle?.leaseAcquiredAt, now)) continue;
    await releaseVehicleReservation(carrierId, vehicleId, shipmentId);
    released += 1;
  }
  return released;
}

function leaseIsStranded(shipment: LeaseSnapshot | undefined, vehicleId: string, acquiredAt: Date | null | undefined, now: Date): boolean {
  if (!shipment) return true;
  if (terminal.has(shipment.status)) return true;
  const pointsHere = shipment.vehicleId?.toString() === vehicleId;
  if (pointsHere && unfinished.has(shipment.status)) return false;
  if (shipment.vehicleId && !pointsHere) return true;
  if (!shipment.vehicleId && unfinished.has(shipment.status)) {
    if (acquiredAt == null) return true;
    return now.getTime() - acquiredAt.getTime() >= leaseGraceMs;
  }
  return true;
}

async function conflictsFromVehicleField(): Promise<LeaseConflict[]> {
  const rows = await Shipment.aggregate<ConflictRow>([
    { $match: { vehicleId: { $type: "objectId" }, status: { $in: [...unfinishedShipmentStatuses] } } },
    { $group: { _id: "$vehicleId", shipmentIds: { $addToSet: "$_id" } } },
    { $match: { $expr: { $gt: [{ $size: "$shipmentIds" }, 1] } } },
  ]);
  return rows.map((row) => ({
    vehicleId: row._id.toString(),
    shipmentIds: row.shipmentIds.map((id) => id.toString()),
  }));
}

async function conflictsFromLeaseArray(): Promise<LeaseConflict[]> {
  const vehicles = await Vehicle.find({ "leasedShipmentIds.1": { $exists: true } }).select("leasedShipmentIds");
  const conflicts: LeaseConflict[] = [];
  for (const vehicle of vehicles) {
    const unfinishedRows = await Shipment.find({
      _id: { $in: vehicle.leasedShipmentIds ?? [] },
      status: { $in: [...unfinishedShipmentStatuses] },
    }).select("_id");
    if (unfinishedRows.length > 1) {
      conflicts.push({
        vehicleId: vehicle._id.toString(),
        shipmentIds: unfinishedRows.map((row) => row._id.toString()),
      });
    }
  }
  return conflicts;
}

function mergeConflicts(groups: LeaseConflict[]): LeaseConflict[] {
  const byVehicle = new Map<string, Set<string>>();
  for (const group of groups) {
    const ids = byVehicle.get(group.vehicleId) ?? new Set<string>();
    for (const id of group.shipmentIds) ids.add(id);
    byVehicle.set(group.vehicleId, ids);
  }
  return [...byVehicle.entries()].map(([vehicleId, ids]) => ({ vehicleId, shipmentIds: [...ids].sort() }));
}

type ConflictRow = {
  _id: { toString(): string };
  shipmentIds: Array<{ toString(): string }>;
};
