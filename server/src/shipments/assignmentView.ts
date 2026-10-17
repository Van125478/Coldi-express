import { User } from "../models/user.js";
import { Vehicle } from "../models/vehicle.js";
import {
  toCarrierShipmentDto,
  toShipmentDto,
  type CarrierShipmentDto,
  type ShipmentDto,
  type ShipmentRecord,
} from "./shipmentDto.js";

type Named = { vehicleLabel: string | null; driverName: string | null };

function idList(shipments: readonly ShipmentRecord[], key: "vehicleId" | "driverId"): string[] {
  const ids = new Set<string>();
  for (const shipment of shipments) {
    const value = shipment[key];
    if (value) ids.add(value.toString());
  }
  return [...ids];
}

async function namesFor(shipments: readonly ShipmentRecord[]): Promise<Map<string, Named>> {
  const vehicleIds = idList(shipments, "vehicleId");
  const driverIds = idList(shipments, "driverId");
  const [vehicles, drivers] = await Promise.all([
    vehicleIds.length === 0 ? [] : Vehicle.find({ _id: { $in: vehicleIds } }).select("label"),
    driverIds.length === 0 ? [] : User.find({ _id: { $in: driverIds } }).select("displayName"),
  ]);
  const vehicleLabels = new Map(vehicles.map((vehicle) => [vehicle._id.toString(), vehicle.label]));
  const driverNames = new Map(drivers.map((driver) => [driver._id.toString(), driver.displayName ?? null]));
  const names = new Map<string, Named>();
  for (const shipment of shipments) {
    const vehicleId = shipment.vehicleId?.toString() ?? null;
    const driverId = shipment.driverId?.toString() ?? null;
    names.set(shipment._id.toString(), {
      vehicleLabel: vehicleId ? (vehicleLabels.get(vehicleId) ?? null) : null,
      driverName: driverId ? (driverNames.get(driverId) ?? null) : null,
    });
  }
  return names;
}

export async function toShipmentViews(shipments: readonly ShipmentRecord[]): Promise<ShipmentDto[]> {
  const names = await namesFor(shipments);
  return shipments.map((shipment) => toShipmentDto(shipment, names.get(shipment._id.toString())));
}

export async function toShipmentView(shipment: ShipmentRecord): Promise<ShipmentDto> {
  const [view] = await toShipmentViews([shipment]);
  if (!view) throw new Error("Shipment view was not created.");
  return view;
}

export async function toCarrierShipmentViews(shipments: readonly ShipmentRecord[]): Promise<CarrierShipmentDto[]> {
  const names = await namesFor(shipments);
  return shipments.map((shipment) => toCarrierShipmentDto(shipment, names.get(shipment._id.toString())));
}

export async function toCarrierShipmentView(shipment: ShipmentRecord): Promise<CarrierShipmentDto> {
  const [view] = await toCarrierShipmentViews([shipment]);
  if (!view) throw new Error("Shipment view was not created.");
  return view;
}
