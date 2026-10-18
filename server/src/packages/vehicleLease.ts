import { Vehicle } from "../models/vehicle.js";

export async function reserveVehicleForShipment(carrierId: string, vehicleId: string, shipmentId: string) {
  return Vehicle.findOneAndUpdate(
    { _id: vehicleId, carrierId, status: { $ne: "ARCHIVED" } },
    { $addToSet: { leasedShipmentIds: shipmentId } },
    { returnDocument: "after" },
  );
}

export async function releaseVehicleReservation(carrierId: string, vehicleId: string, shipmentId: string): Promise<void> {
  await Vehicle.updateOne({ _id: vehicleId, carrierId }, { $pull: { leasedShipmentIds: shipmentId } });
}
