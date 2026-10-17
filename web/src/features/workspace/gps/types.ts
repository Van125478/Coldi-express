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
  not_started: "Chưa bắt đầu vận chuyển",
  waiting_for_fix: "Đang vận chuyển — chưa có vị trí GPS",
  current: "Đang vận chuyển — vị trí mới cập nhật",
  stale: "Đang vận chuyển — vị trí cập nhật đã lâu",
  ended: "Đã xác nhận giao hàng — ngừng theo dõi trực tiếp",
};
