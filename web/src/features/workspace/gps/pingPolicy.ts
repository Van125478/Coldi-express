/** Keep in step with server/src/gps/pingPolicy.ts. The server tests own this reference policy. */
export const STATIONARY_SPEED_KMH = 5;
export const STATIONARY_INTERVAL_MS = 15 * 60 * 1000;
export const MOVING_INTERVAL_MS = 4 * 60 * 1000;
export const DISTANCE_TRIGGER_KM = 2;
export const LOCAL_SAMPLE_INTERVAL_MS = 60 * 1000;

export type PingPlan = {
  intervalMs: number;
  uploadBecauseDistance: boolean;
  warehouseProximity: "unavailable";
  reason: "stationary" | "moving" | "unknown_speed" | "distance";
};

export function planPing(input: { speedKmh: number | null; distanceKmSinceAccepted: number | null }): PingPlan {
  const distance = input.distanceKmSinceAccepted;
  const moved = distance != null && Number.isFinite(distance) && distance > DISTANCE_TRIGGER_KM;
  if (input.speedKmh != null && Number.isFinite(input.speedKmh) && input.speedKmh < STATIONARY_SPEED_KMH) {
    return { intervalMs: STATIONARY_INTERVAL_MS, uploadBecauseDistance: false, warehouseProximity: "unavailable", reason: "stationary" };
  }
  if (input.speedKmh != null && Number.isFinite(input.speedKmh)) {
    return {
      intervalMs: MOVING_INTERVAL_MS,
      uploadBecauseDistance: moved,
      warehouseProximity: "unavailable",
      reason: moved ? "distance" : "moving",
    };
  }
  return {
    intervalMs: STATIONARY_INTERVAL_MS,
    uploadBecauseDistance: moved,
    warehouseProximity: "unavailable",
    reason: moved ? "distance" : "unknown_speed",
  };
}

export function nextCheckDelayMs(plan: PingPlan): number {
  if (plan.reason === "stationary") return plan.intervalMs;
  return LOCAL_SAMPLE_INTERVAL_MS;
}

export function distanceKm(
  from: { latitude: number; longitude: number } | null,
  to: { latitude: number; longitude: number } | null,
): number | null {
  if (!from || !to) return null;
  if (![from.latitude, from.longitude, to.latitude, to.longitude].every((value) => Number.isFinite(value))) return null;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const lat = toRad(to.latitude - from.latitude);
  const lng = toRad(to.longitude - from.longitude);
  const a = Math.sin(lat / 2) ** 2 + Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(lng / 2) ** 2;
  return 2 * earthKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
