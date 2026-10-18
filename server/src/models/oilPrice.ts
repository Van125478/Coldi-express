import { Schema, model, type InferSchemaType } from "mongoose";
import { OIL_FREQUENCY, OIL_PROVIDER, oilBenchmarks, syncStatuses } from "../market/oil/policy.js";

const observationSchema = new Schema(
  {
    provider: { type: String, required: true, enum: [OIL_PROVIDER] },
    seriesId: { type: String, required: true, enum: ["RBRTE", "RWTC"] },
    benchmark: { type: String, required: true, enum: oilBenchmarks },
    frequency: { type: String, required: true, enum: [OIL_FREQUENCY] },
    observedDate: { type: String, required: true },
    priceUsdPerBarrel: { type: String, required: true },
    unit: { type: String, required: true, enum: ["barrel"] },
    currency: { type: String, required: true, enum: ["USD"] },
    sourceUrl: { type: String, required: true },
    fetchedAt: { type: Date, required: true },
    publishedAt: { type: Date, default: null },
    revision: { type: Number, required: true, min: 1 },
    superseded: { type: Boolean, required: true, default: false },
    validation: {
      type: new Schema(
        {
          unitsRaw: { type: String, required: true },
          schemaVersion: { type: String, required: true },
        },
        { _id: false },
      ),
      required: true,
    },
  },
  { timestamps: true },
);

observationSchema.index({ provider: 1, seriesId: 1, frequency: 1, observedDate: 1, revision: 1 }, { unique: true });
observationSchema.index({ provider: 1, seriesId: 1, frequency: 1, superseded: 1, observedDate: -1, revision: -1 });

const syncStateSchema = new Schema(
  {
    provider: { type: String, required: true, enum: [OIL_PROVIDER] },
    seriesId: { type: String, required: true, enum: ["RBRTE", "RWTC"] },
    benchmark: { type: String, required: true, enum: oilBenchmarks },
    status: { type: String, required: true, enum: syncStatuses },
    lastAttemptedAt: { type: Date, default: null },
    lastSuccessfulAt: { type: Date, default: null },
    lastErrorCode: { type: String, default: null },
    lastErrorMessage: { type: String, default: null, maxlength: 200 },
  },
  { timestamps: true },
);

syncStateSchema.index({ provider: 1, seriesId: 1 }, { unique: true });

const scheduleSchema = new Schema(
  {
    provider: { type: String, required: true, enum: [OIL_PROVIDER] },
    seriesId: { type: String, required: true, enum: ["RBRTE", "RWTC"] },
    verified: { type: Boolean, required: true, default: false },
    frequency: { type: String, required: true, enum: [OIL_FREQUENCY] },
    expectedWeekdays: { type: [Number], required: true, default: [] },
    excludedDates: { type: [String], required: true, default: [] },
    deadlineOffsetDays: { type: Number, required: true, default: 0 },
    deadlineMinutesUtc: { type: Number, required: true, default: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

scheduleSchema.index({ provider: 1, seriesId: 1 }, { unique: true });

const lockSchema = new Schema(
  {
    _id: { type: String, required: true },
    owner: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false },
);

export type OilPriceObservationRecord = InferSchemaType<typeof observationSchema>;
export type OilPriceSyncStateRecord = InferSchemaType<typeof syncStateSchema>;
export type OilSourceScheduleRecord = InferSchemaType<typeof scheduleSchema>;

export const OilPriceObservation = model("OilPriceObservation", observationSchema);
export const OilPriceSyncState = model("OilPriceSyncState", syncStateSchema);
export const OilSourceSchedule = model("OilSourceSchedule", scheduleSchema);
export const OilSyncLock = model("OilSyncLock", lockSchema);
