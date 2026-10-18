export const unfinishedShipmentStatuses = ["DRAFT", "MATCHED", "PICKUP_CONFIRMED", "IN_TRANSIT", "INCIDENT"] as const;

export function activeVehicleFilter(): { status: { $ne: "ARCHIVED" } } {
  return { status: { $ne: "ARCHIVED" } };
}
