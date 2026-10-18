import { PlanDefinition, PlanVersion } from "../models/package.js";
import { planCatalog, type PlanSpec } from "./catalog.js";

let published: Promise<void> | null = null;

const initialEffectiveFrom = new Date("2026-10-18T00:00:00.000Z");
const approvedPricingEffectiveFrom = new Date("2026-10-18T12:00:00.000Z");

export function ensurePublishedCatalog(): Promise<void> {
  published ??= publishPlanVersions().catch((error: unknown) => {
    published = null;
    throw error;
  });
  return published;
}

type PublishedCommercial = {
  priceVnd?: number | null;
  rateBps?: number | null;
  vehicleCap?: number | null;
  rateMinBps?: number | null;
  rateMaxBps?: number | null;
  contractRequired: boolean;
  revision: number;
};

export async function publishPlanVersions(): Promise<void> {
  for (const plan of planCatalog) {
    await PlanDefinition.updateOne(
      { code: plan.code },
      {
        $setOnInsert: {
          code: plan.code,
          audience: plan.audience,
          name: plan.name,
          billingCycle: plan.billingCycle,
          contractRequired: plan.contractRequired,
        },
      },
      { upsert: true },
    );
    const latest = await PlanVersion.findOne({ planCode: plan.code, status: "PUBLISHED" }).sort({ revision: -1 });
    if (latest && sameCommercial(latest, plan)) continue;
    const revision = (latest?.revision ?? 0) + 1;
    try {
      await PlanVersion.create({
        planCode: plan.code,
        revision,
        priceVnd: plan.priceVnd,
        rateBps: plan.rateBps,
        vehicleCap: plan.vehicleCap,
        rateMinBps: plan.rateMinBps,
        rateMaxBps: plan.rateMaxBps,
        contractRequired: plan.contractRequired,
        status: "PUBLISHED",
        effectiveFrom: revision === 1 ? initialEffectiveFrom : approvedPricingEffectiveFrom,
      });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const current = await PlanVersion.findOne({ planCode: plan.code, status: "PUBLISHED" }).sort({ revision: -1 });
      if (!current || !sameCommercial(current, plan)) throw error;
    }
  }
}

function sameCommercial(version: PublishedCommercial, plan: PlanSpec): boolean {
  return (version.priceVnd ?? null) === plan.priceVnd
    && (version.rateBps ?? null) === plan.rateBps
    && (version.vehicleCap ?? null) === plan.vehicleCap
    && (version.rateMinBps ?? null) === plan.rateMinBps
    && (version.rateMaxBps ?? null) === plan.rateMaxBps
    && version.contractRequired === plan.contractRequired;
}

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
