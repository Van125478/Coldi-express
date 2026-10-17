export type DriverLane = "pickup" | "transit" | "delivered" | "other";

const laneRank: Record<DriverLane, number> = {
  pickup: 0,
  transit: 1,
  delivered: 2,
  other: 3,
};

export function driverLane(status: string): DriverLane {
  if (status === "MATCHED") return "pickup";
  if (status === "IN_TRANSIT") return "transit";
  if (status === "DELIVERY_CONFIRMED") return "delivered";
  return "other";
}

export function driverLaneLabel(lane: DriverLane): string {
  if (lane === "pickup") return "Chờ lấy hàng";
  if (lane === "transit") return "Đang vận chuyển";
  if (lane === "delivered") return "Đã giao";
  return "Trạng thái khác";
}

export function driverCounts(items: readonly { status: string }[]): { pickup: number; transit: number; delivered: number } {
  return {
    pickup: items.filter((item) => driverLane(item.status) === "pickup").length,
    transit: items.filter((item) => driverLane(item.status) === "transit").length,
    delivered: items.filter((item) => driverLane(item.status) === "delivered").length,
  };
}

export function currentDriverTrip<T extends { nextAction: "pickup" | "delivery" | "none" }>(items: readonly T[]): T | null {
  return items.find((item) => item.nextAction === "delivery") ?? items.find((item) => item.nextAction === "pickup") ?? null;
}

export function otherActionableTrips<T extends { nextAction: "pickup" | "delivery" | "none" }>(items: readonly T[], current: T | null): T[] {
  return items.filter((item) => item !== current && item.nextAction !== "none").slice(0, 3);
}

export function compareDriverTrips(left: { status: string }, right: { status: string }): number {
  return laneRank[driverLane(left.status)] - laneRank[driverLane(right.status)];
}

export function driverActionLabel(action: "pickup" | "delivery" | "none"): string {
  if (action === "pickup") return "Xác nhận lấy hàng";
  if (action === "delivery") return "Xác nhận giao hàng";
  return "Xem chi tiết chuyến";
}
