export type TemperatureGroup = "COOL" | "FROZEN" | "DEEP_FROZEN";

export type PublishedShipment = {
  id: string;
  shipperId: string;
  cargoDescription: string;
  pickupLocation: string;
  deliveryLocation: string;
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
  createdAt: string;
  updatedAt: string;
};

export type CarrierVehicle = {
  id: string;
  label: string;
};

export type CarrierDriver = {
  id: string;
  displayName: string | null;
};

export type CarrierShipment = {
  id: string;
  cargoDescription: string;
  pickupLocation: string;
  deliveryLocation: string;
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
  createdAt: string;
  updatedAt: string;
};

export type PublishShipmentInput = {
  cargoDescription: string;
  pickupLocation: string;
  deliveryLocation: string;
  temperatureGroup: TemperatureGroup;
  vehicleRequirement: string;
  listedPriceVnd: number;
};
