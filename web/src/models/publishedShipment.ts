export type TemperatureGroup = "COOL" | "FROZEN" | "DEEP_FROZEN";

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
};

export type CarrierDriver = {
  id: string;
  displayName: string | null;
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
