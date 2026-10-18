import { PlanDefinition, PlanVersion } from "../models/package.js";
import { planCatalog } from "./catalog.js";

let published: Promise<void> | null = null;

export function ensurePublishedCatalog(): Promise<void> {
  published ??= writeCatalog().catch((error: unknown) => {
    published = null;
    throw error;
  });
  return published;
}

async function writeCatalog(): Promise<void> {
  const effectiveFrom = new Date("2026-10-18T00:00:00.000Z");
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
    const existing = await PlanVersion.findOne({ planCode: plan.code, revision: 1 });
    if (existing) continue;
    try {
      await PlanVersion.create({
        planCode: plan.code,
        revision: 1,
        priceVnd: plan.priceVnd,
        rateBps: plan.rateBps,
        vehicleCap: plan.vehicleCap,
        rateMinBps: plan.rateMinBps,
        rateMaxBps: plan.rateMaxBps,
        contractRequired: plan.contractRequired,
        status: "PUBLISHED",
        effectiveFrom,
      });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
}

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
