import type { PublishedShipment, PublishShipmentInput } from "@/models/publishedShipment";
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
