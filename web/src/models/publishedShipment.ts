export type TemperatureGroup = "COOL" | "FROZEN" | "DEEP_FROZEN";

export type ShipmentTimelineEvent = {
  id: string;
  type: "PUBLISHED" | "CLAIMED" | "ASSIGNED" | "PICKUP_CONFIRMED" | "DELIVERY_CONFIRMED";
  label: string;
  occurredAt: string;
  actorRole: "SHIPPER" | "CARRIER" | "DRIVER";
  actorLabel: string;
  statusAfter: string;
  statusAfterLabel: string;
  detail: string | null;
  recorded: boolean;
  sequence: number;
};

export type ShipmentTimeline = {
  completeness: "recorded" | "partial";
  note: string | null;
  events: ShipmentTimelineEvent[];
};

type ShipmentSchedule = {
  cargoDescription: string;
  pickupCompany: string | null;
  pickupLocation: string;
  pickupContactName: string | null;
  pickupPhone: string | null;
  pickupDate: string | null;
  pickupTimeFrom: string | null;
  pickupTimeTo: string | null;
  deliveryCompany: string | null;
  deliveryLocation: string;
  deliveryContactName: string | null;
  deliveryPhone: string | null;
  deliveryDate: string | null;
  deliveryTimeFrom: string | null;
  deliveryTimeTo: string | null;
  cargoWeightTon: number | null;
  cargoVolumeM3: number | null;
  packageCount: number | null;
  temperatureGroup: TemperatureGroup;
  temperatureLabel: string;
  vehicleRequirement: string;
  listedPriceVnd: number;
  status: string;
  statusLabel: string;
  carrierId: string | null;
  vehicleId: string | null;
  driverId: string | null;
  vehicleLabel: string | null;
  driverName: string | null;
  pickupConfirmedAt: string | null;
  deliveryConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline?: ShipmentTimeline;
};

export type PublishedShipment = ShipmentSchedule & {
  id: string;
  shipperId: string;
  pickupEmail: string | null;
  deliveryEmail: string | null;
};

export type CarrierVehicle = {
  id: string;
  label: string;
  plate: string | null;
  vehicleKind: "REEFER_TRUCK" | "REEFER_CONTAINER" | "REEFER_VAN" | null;
  vehicleKindLabel: string | null;
  temperatureGroup: "COOL" | "FROZEN" | "DEEP_FROZEN" | null;
  temperatureLabel: string | null;
  capacityTon: number | null;
  status?: "ACTIVE" | "ARCHIVED";
  statusLabel?: string;
  canArchive?: boolean;
  archiveBlockReason?: string | null;
  availableForAssignment?: boolean;
};

export type CarrierDriver = {
  id: string;
  displayName: string | null;
  email?: string;
  accountStatus?: "ACTIVE" | "LOCKED";
  mustChangePassword?: boolean;
};

export type CarrierShipment = ShipmentSchedule & {
  id: string;
};

export type DriverShipment = CarrierShipment & {
  nextAction: "pickup" | "delivery" | "none";
};

export type PublishShipmentInput = {
  cargoDescription: string;
  pickupCompany: string;
  pickupLocation: string;
  pickupContactName: string;
  pickupPhone: string;
  pickupEmail: string | null;
  pickupDate: string;
  pickupTimeFrom: string;
  pickupTimeTo: string;
  deliveryCompany: string;
  deliveryLocation: string;
  deliveryContactName: string;
  deliveryPhone: string;
  deliveryEmail: string | null;
  deliveryDate: string;
  deliveryTimeFrom: string;
  deliveryTimeTo: string;
  cargoWeightTon: number;
  cargoVolumeM3: number;
  packageCount: number;
  temperatureGroup: TemperatureGroup;
  vehicleRequirement: string;
  listedPriceVnd: number;
};
