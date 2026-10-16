import { temperatureLabels, type ShipmentStatus, type TemperatureGroup } from "../models/shipment.js";

export type ShipmentDto = {
  id: string;
  shipperId: string;
  cargoDescription: string;
  pickupLocation: string;
  deliveryLocation: string;
  temperatureGroup: TemperatureGroup;
  temperatureLabel: string;
  vehicleRequirement: string;
  listedPriceVnd: number;
  status: ShipmentStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
};

const statusLabels: Record<ShipmentStatus, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đang tìm xe",
  MATCHED: "Đã có xe nhận chuyến",
  PICKUP_CONFIRMED: "Đã xác nhận lấy hàng",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERY_CONFIRMED: "Đã xác nhận giao hàng",
  COMPLETED: "Hoàn tất",
  INCIDENT: "Có sự cố",
  CANCELLED: "Đã hủy",
};

type ShipmentRecord = {
  _id: { toString(): string };
  shipperId: { toString(): string };
  cargoDescription: string;
  pickupLocation: string;
  deliveryLocation: string;
  temperatureGroup: TemperatureGroup;
  vehicleRequirement: string;
  listedPriceVnd: number;
  status: ShipmentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export function toShipmentDto(shipment: ShipmentRecord): ShipmentDto {
  return {
    id: shipment._id.toString(),
    shipperId: shipment.shipperId.toString(),
    cargoDescription: shipment.cargoDescription,
    pickupLocation: shipment.pickupLocation,
    deliveryLocation: shipment.deliveryLocation,
    temperatureGroup: shipment.temperatureGroup,
    temperatureLabel: temperatureLabels[shipment.temperatureGroup],
    vehicleRequirement: shipment.vehicleRequirement,
    listedPriceVnd: shipment.listedPriceVnd,
    status: shipment.status,
    statusLabel: statusLabels[shipment.status],
    createdAt: shipment.createdAt.toISOString(),
    updatedAt: shipment.updatedAt.toISOString(),
  };
}
