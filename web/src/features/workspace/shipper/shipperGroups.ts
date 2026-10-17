export type ShipperBucket = "published" | "matched" | "transit" | "delivered" | "other";

export function shipperBucket(status: string): ShipperBucket {
  if (status === "PUBLISHED") return "published";
  if (status === "MATCHED") return "matched";
  if (status === "IN_TRANSIT") return "transit";
  if (status === "DELIVERY_CONFIRMED") return "delivered";
  return "other";
}

export function followedShipment<T extends { status: string }>(items: readonly T[]): T | null {
  return items.find((item) => item.status === "IN_TRANSIT") ?? items.find((item) => item.status === "MATCHED") ?? null;
}
