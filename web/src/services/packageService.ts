import { apiRequest } from "@/services/apiClient";

export type PackagePlan = {
  code: string;
  audience: "SHIPPER" | "CARRIER";
  name: string;
  billingCycle: "NONE" | "MONTH" | "YEAR";
  priceVnd: number | null;
  rateBps: number | null;
  vehicleCap: number | null;
  contractRequired: boolean;
  quoteRequired: boolean;
  listPriceLabel: string;
  rateLabel: string;
  paymentCollected: false;
};

export type Entitlements = {
  accountId: string;
  role: "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN";
  planCode: string | null;
  planName: string | null;
  priceVnd: number | null;
  rateBps: number | null;
  vehicleCap: number | null;
  activeVehicleCount: number;
  overLimit: boolean;
  startsAt: string | null;
  endsAt: string | null;
  scheduledDowngradeAt: string | null;
  activationSource: "IMPLICIT_FREE" | "DEMO_QA";
  paymentCollected: false;
  demoActivationAvailable: boolean;
  shipmentQuota: null;
  premiumEntitlements: false;
};

export type PlanView = {
  code: string | null;
  name: string | null;
  priceVnd: number | null;
  rateBps: number | null;
  vehicleCap: number | null;
  startsAt: string | null;
  endsAt: string | null;
  scheduledDowngradeAt: string | null;
  activationSource: "IMPLICIT_FREE" | "DEMO_QA";
  paymentCollected: false;
  demo: boolean;
  label: string;
};

export function listPackageCatalog(): Promise<{ plans: PackagePlan[] }> {
  return apiRequest("/api/packages/catalog");
}

export function getMyPlan(): Promise<{ plan: PlanView; entitlements: Entitlements }> {
  return apiRequest("/api/packages/my-plan");
}

export function activateDemoPlan(input: {
  planCode: string;
  idempotencyKey: string;
  contract?: { priceVnd: number; rateBps: number; vehicleCap?: number };
}): Promise<{ paymentCollected: false; label: string; entitlements: Entitlements }> {
  return apiRequest("/api/packages/my-plan/demo-activate", { method: "POST", body: JSON.stringify(input) });
}

export function scheduleDowngrade(idempotencyKey: string): Promise<{ paymentCollected: false; label: string; entitlements: Entitlements }> {
  return apiRequest("/api/packages/my-plan/schedule-downgrade", { method: "POST", body: JSON.stringify({ idempotencyKey }) });
}
