export type ChatMessage = {
  id: string;
  conversationId: string;
  senderRole: "SHIPPER" | "CARRIER";
  body: string;
  sequence: number;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  shipmentId: string;
  carrierLabel: string;
  writable: boolean;
  createdAt: string;
  updatedAt: string;
};

export function senderLabel(role: "SHIPPER" | "CARRIER", viewer: "SHIPPER" | "CARRIER", carrierLabel: string): string {
  if (role === viewer) return "Bạn";
  if (role === "SHIPPER") return "Chủ hàng";
  return carrierLabel;
}
