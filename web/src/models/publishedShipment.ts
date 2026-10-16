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
  createdAt: string;
  updatedAt: string;
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
