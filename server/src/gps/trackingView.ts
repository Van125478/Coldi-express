import { Types } from "mongoose";
import type { ShipmentStatus } from "../models/shipment.js";
import { LOCATION_CURRENT_MS } from "./pingPolicy.js";
import type { LocationSample } from "./locationInput.js";

export type TrackingPhase = "not_started" | "waiting_for_fix" | "current" | "stale" | "ended";

export type StoredLocation = {
  latitude: number;
  longitude: number;
  speedKmh?: number | null;
  bearingDeg?: number | null;
  observedAt: Date;
  receivedAt: Date;
  driverId: { toString(): string };
};

export type TrackingDto = {
  status: ShipmentStatus;
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

export function locationUpdate(driverId: string, sample: LocationSample, receivedAt = new Date()) {
  const next = {
    latitude: sample.latitude,
    longitude: sample.longitude,
    speedKmh: sample.speedKmh,
    bearingDeg: sample.bearingDeg,
    observedAt: sample.observedAt,
    receivedAt,
    driverId: new Types.ObjectId(driverId),
  };
  return [
    {
      $set: {
        latestLocation: {
          $cond: [
            {
              $or: [
                { $eq: [{ $ifNull: ["$latestLocation.observedAt", null] }, null] },
                { $lt: ["$latestLocation.observedAt", sample.observedAt] },
              ],
            },
            next,
            "$latestLocation",
          ],
        },
      },
    },
  ];
}

export function toTrackingDto(
  status: ShipmentStatus,
  location: StoredLocation | null | undefined,
  now = new Date(),
): TrackingDto {
  const phase = phaseFor(status, location?.receivedAt ?? null, now);
  const visible = phase === "current" || phase === "stale" || phase === "ended";
  if (!location || !visible) return { status, phase, location: null };
  return {
    status,
    phase,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      speedKmh: location.speedKmh ?? null,
      bearingDeg: location.bearingDeg ?? null,
      observedAt: location.observedAt.toISOString(),
      receivedAt: location.receivedAt.toISOString(),
    },
  };
}

export function phaseFor(status: ShipmentStatus, receivedAt: Date | null, now: Date): TrackingPhase {
  if (status === "DELIVERY_CONFIRMED") return "ended";
  if (status !== "IN_TRANSIT") return "not_started";
  if (!receivedAt) return "waiting_for_fix";
  return now.getTime() - receivedAt.getTime() <= LOCATION_CURRENT_MS ? "current" : "stale";
}
