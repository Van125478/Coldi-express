export type ChatShipment = {
  status: string;
  carrierId?: { toString(): string } | null;
};

/** Provisional: a thread stays writable only while the shipment is still open, or this carrier won the claim. */
export function chatWritable(shipment: ChatShipment, carrierId: string): boolean {
  if (shipment.status === "PUBLISHED" && (shipment.carrierId == null)) return true;
  return shipment.carrierId?.toString() === carrierId;
}
