import type { ChatConversation, ChatMessage } from "@/features/workspace/chat/types";
import type { ShipmentTracking } from "@/features/workspace/gps/types";
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

export function getShipmentLocation(id: string): Promise<{ tracking: ShipmentTracking }> {
  return apiRequest(`/api/shipments/${id}/location`);
}

export function getCarrierShipmentLocation(id: string): Promise<{ tracking: ShipmentTracking }> {
  return apiRequest(`/api/carrier/shipments/${id}/location`);
}

export function listCarrierShipments(search = ""): Promise<{ shipments: CarrierShipment[]; total?: number; shown?: number; truncated?: boolean }> {
  const query = search.length > 0 ? `?${search}` : "";
  return apiRequest(`/api/carrier/shipments${query}`);
}

export function claimShipment(id: string): Promise<{ shipment: CarrierShipment }> {
  return apiRequest(`/api/carrier/shipments/${id}/claim`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getCarrierShipment(id: string): Promise<{ shipment: CarrierShipment }> {
  return apiRequest(`/api/carrier/shipments/${id}`);
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

export function getCarrierVehicle(id: string): Promise<{ vehicle: CarrierVehicle }> {
  return apiRequest(`/api/carrier/fleet/vehicles/${id}`);
}

export function createCarrierVehicle(input: {
  label: string;
  plate: string;
  vehicleKind: string;
  temperatureGroup: string;
  capacityTon: number;
}): Promise<{ vehicle: CarrierVehicle }> {
  return apiRequest("/api/carrier/fleet/vehicles", { method: "POST", body: JSON.stringify(input) });
}

export function updateCarrierVehicle(
  id: string,
  input: { label: string; plate: string; vehicleKind: string; temperatureGroup: string; capacityTon: number },
): Promise<{ vehicle: CarrierVehicle }> {
  return apiRequest(`/api/carrier/fleet/vehicles/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function getCarrierDriver(id: string): Promise<{ driver: CarrierDriver }> {
  return apiRequest(`/api/carrier/fleet/drivers/${id}`);
}

export function updateCarrierDriverName(id: string, displayName: string): Promise<{ driver: CarrierDriver }> {
  return apiRequest(`/api/carrier/fleet/drivers/${id}`, { method: "PATCH", body: JSON.stringify({ displayName }) });
}

export function createCarrierDriver(input: { displayName: string; email: string }): Promise<{ driver: CarrierDriver; temporaryPassword: string }> {
  return apiRequest("/api/carrier/fleet/drivers", { method: "POST", body: JSON.stringify(input) });
}

export function lockCarrierDriver(id: string): Promise<{ driver: CarrierDriver }> {
  return apiRequest(`/api/carrier/fleet/drivers/${id}/lock`, { method: "POST", body: JSON.stringify({}) });
}

export function unlockCarrierDriver(id: string): Promise<{ driver: CarrierDriver }> {
  return apiRequest(`/api/carrier/fleet/drivers/${id}/unlock`, { method: "POST", body: JSON.stringify({}) });
}

export function resetCarrierDriverPassword(id: string): Promise<{ driver: CarrierDriver; temporaryPassword: string }> {
  return apiRequest(`/api/carrier/fleet/drivers/${id}/reset-password`, { method: "POST", body: JSON.stringify({}) });
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

export function submitDriverLocation(
  id: string,
  input: { latitude: number; longitude: number; speedKmh: number | null; bearingDeg: number | null; observedAt: string },
): Promise<{ tracking: ShipmentTracking }> {
  const body: Record<string, unknown> = {
    latitude: input.latitude,
    longitude: input.longitude,
    observedAt: input.observedAt,
  };
  if (input.speedKmh != null) body.speedKmh = input.speedKmh;
  if (input.bearingDeg != null) body.bearingDeg = input.bearingDeg;
  return apiRequest(`/api/driver/shipments/${id}/location`, { method: "POST", body: JSON.stringify(body) });
}

export function openCarrierConversation(shipmentId: string): Promise<{ conversation: ChatConversation }> {
  return apiRequest(`/api/carrier/conversations/by-shipment/${shipmentId}`, { method: "POST", body: JSON.stringify({}) });
}

export function getCarrierMessages(conversationId: string, after: number): Promise<{ messages: ChatMessage[]; writable: boolean }> {
  return apiRequest(`/api/carrier/conversations/${conversationId}/messages?after=${after}`);
}

export function sendCarrierMessage(conversationId: string, body: string): Promise<{ message: ChatMessage }> {
  return apiRequest(`/api/carrier/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
}

export function listShipmentConversations(shipmentId: string): Promise<{ conversations: ChatConversation[] }> {
  return apiRequest(`/api/shipments/${shipmentId}/conversations`);
}

export function getShipperMessages(shipmentId: string, conversationId: string, after: number): Promise<{ messages: ChatMessage[]; writable: boolean }> {
  return apiRequest(`/api/shipments/${shipmentId}/conversations/${conversationId}/messages?after=${after}`);
}

export function sendShipperMessage(shipmentId: string, conversationId: string, body: string): Promise<{ message: ChatMessage }> {
  return apiRequest(`/api/shipments/${shipmentId}/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function assignShipment(id: string, input: { vehicleId: string; driverId: string }): Promise<{ shipment: CarrierShipment }> {
  return apiRequest(`/api/carrier/shipments/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
