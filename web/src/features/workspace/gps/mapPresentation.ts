import type { TrackingPhase } from "./types";

export type LngLat = readonly [longitude: number, latitude: number];

export type MapTone = "current" | "stale" | "historical";

export type MapAvailability = "ready" | "missing_token" | "webgl" | "load_failed";

export type MapPresentation =
  | { kind: "inactive" }
  | { kind: "waiting" }
  | { kind: "api_error" }
  | { kind: "coordinates"; position: LngLat; tone: MapTone; map: MapAvailability };

export type MapHandle = {
  setPosition(position: LngLat): void;
  recenter(position: LngLat): void;
  remove(): void;
};

export function toMapboxPosition(latitude: unknown, longitude: unknown): LngLat | null {
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return [longitude, latitude];
}

export function readPublicMapboxToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (!token.startsWith("pk.") || token.length < 10 || /\s/.test(token)) return null;
  return token;
}

export function presentLocation(input: {
  apiProblem: boolean;
  phase: TrackingPhase | null;
  latitude: unknown;
  longitude: unknown;
  token: string | null;
  webglSupported: boolean;
  loadFailed: boolean;
}): MapPresentation {
  if (input.apiProblem) return { kind: "api_error" };
  if (input.phase === null || input.phase === "not_started") return { kind: "inactive" };
  if (input.phase === "waiting_for_fix") return { kind: "waiting" };
  const position = toMapboxPosition(input.latitude, input.longitude);
  if (!position) return input.phase === "ended" ? { kind: "inactive" } : { kind: "waiting" };
  const tone: MapTone = input.phase === "ended" ? "historical" : input.phase === "stale" ? "stale" : "current";
  const map: MapAvailability = !input.token ? "missing_token" : !input.webglSupported ? "webgl" : input.loadFailed ? "load_failed" : "ready";
  return { kind: "coordinates", position, tone, map };
}

export function bindLiveMap(create: (initial: LngLat) => MapHandle) {
  let handle: MapHandle | null = null;
  let creates = 0;
  return {
    sync(position: LngLat | null) {
      if (!position) return;
      if (!handle) {
        handle = create(position);
        creates += 1;
        return;
      }
      handle.setPosition(position);
    },
    recenter(position: LngLat | null) {
      if (handle && position) handle.recenter(position);
    },
    destroy() {
      handle?.remove();
      handle = null;
    },
    get creates() {
      return creates;
    },
    get alive() {
      return handle !== null;
    },
  };
}
