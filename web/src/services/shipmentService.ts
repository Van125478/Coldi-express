import type { CarrierShipment, PublishedShipment, PublishShipmentInput } from "@/models/publishedShipment";
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

export function listCarrierShipments(): Promise<{ shipments: CarrierShipment[] }> {
  return apiRequest("/api/carrier/shipments");
}

export function claimShipment(id: string): Promise<{ shipment: CarrierShipment }> {
  return apiRequest(`/api/carrier/shipments/${id}/claim`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
