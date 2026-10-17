import type {
  CarrierDriver,
  CarrierShipment,
  DriverShipment,
  CarrierVehicle,
  PublishedShipment,
  PublishShipmentInput,
} from "@/models/publishedShipment";
import { apiRequest } from "@/services/apiClient";

export function publishShipment(input: PublishShipmentInput): Promise<{ shipment: PublishedShipment }> {
  return apiRequest("/api/shipments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMyShipments(): Promise<{ shipments: PublishedShipment[] }> {
  return apiRequest("/api/shipments/mine");
}

export function getMyShipment(id: string): Promise<{ shipment: PublishedShipment }> {
  return apiRequest(`/api/shipments/${id}`);
}

export function listCarrierShipments(): Promise<{ shipments: CarrierShipment[] }> {
  return apiRequest("/api/carrier/shipments");
}

export function claimShipment(id: string): Promise<{ shipment: CarrierShipment }> {
  return apiRequest(`/api/carrier/shipments/${id}/claim`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function listClaimedShipments(): Promise<{ shipments: CarrierShipment[] }> {
  return apiRequest("/api/carrier/shipments/claimed");
}

export function listCarrierVehicles(): Promise<{ vehicles: CarrierVehicle[] }> {
  return apiRequest("/api/carrier/fleet/vehicles");
}

export function listCarrierDrivers(): Promise<{ drivers: CarrierDriver[] }> {
  return apiRequest("/api/carrier/fleet/drivers");
}

export function listDriverShipments(): Promise<{ shipments: DriverShipment[] }> {
  return apiRequest("/api/driver/shipments");
}

export function getDriverShipment(id: string): Promise<{ shipment: DriverShipment }> {
  return apiRequest(`/api/driver/shipments/${id}`);
}

export function confirmDriverPickup(id: string): Promise<{ shipment: DriverShipment }> {
  return apiRequest(`/api/driver/shipments/${id}/pickup`, { method: "POST", body: JSON.stringify({}) });
}

export function confirmDriverDelivery(id: string): Promise<{ shipment: DriverShipment }> {
  return apiRequest(`/api/driver/shipments/${id}/delivery`, { method: "POST", body: JSON.stringify({}) });
}

export function assignShipment(
  id: string,
  input: { vehicleId: string; driverId: string },
): Promise<{ shipment: CarrierShipment }> {
  return apiRequest(`/api/carrier/shipments/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
