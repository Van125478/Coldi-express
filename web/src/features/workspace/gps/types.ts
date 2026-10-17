export type TrackingPhase = "not_started" | "waiting_for_fix" | "current" | "stale" | "ended";

export type ShipmentTracking = {
  status: string;
  phase: TrackingPhase;
  location: {
    latitude: number;
    longitude: number;
    speedKmh: number | null;
    bearingDeg: number | null;
    observedAt: string;
    receivedAt: string;
  } | null;
};

export const trackingLabels: Record<TrackingPhase, string> = {
  not_started: "Chưa có vị trí xe được cập nhật.",
  waiting_for_fix: "Chưa có vị trí xe được cập nhật.",
  current: "Đang vận chuyển.",
  stale: "Vị trí cập nhật đã lâu.",
  ended: "Theo dõi trực tiếp đã kết thúc.",
};
