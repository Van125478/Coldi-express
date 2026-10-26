import type { UserRole } from "../models/user.js";
import type { ShipmentStatus } from "../models/shipment.js";

type ReadableShipment = {
  shipperId: { toString(): string };
  carrierId?: { toString(): string } | null;
  status: ShipmentStatus;
};

export function canReadMobileShipment(role: UserRole, userId: string, shipment: ReadableShipment): boolean {
  if (role === "SHIPPER") return shipment.shipperId.toString() === userId;
  if (role === "CARRIER") {
    const open = shipment.status === "PUBLISHED" && shipment.carrierId == null;
    return open || shipment.carrierId?.toString() === userId;
  }
  return false;
}

export function canReadReviews(role: UserRole, userId: string, shipment: ReadableShipment): boolean {
  if (role === "SHIPPER") return shipment.shipperId.toString() === userId;
  return role === "CARRIER" && shipment.carrierId?.toString() === userId;
}
