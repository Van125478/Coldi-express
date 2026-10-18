export const planAudiences = ["SHIPPER", "CARRIER"] as const;

export type PlanAudience = (typeof planAudiences)[number];

export const billingCycles = ["NONE", "MONTH", "YEAR"] as const;

export type BillingCycle = (typeof billingCycles)[number];

export type PlanSpec = {
  code: string;
  audience: PlanAudience;
  name: string;
  billingCycle: BillingCycle;
  priceVnd: number | null;
  rateBps: number | null;
  rateMinBps: number | null;
  rateMaxBps: number | null;
  vehicleCap: number | null;
  contractRequired: boolean;
  listPriceLabel: string;
  rateLabel: string;
};

export const planCatalog: readonly PlanSpec[] = [
  {
    code: "shipper-free",
    audience: "SHIPPER",
    name: "Free",
    billingCycle: "NONE",
    priceVnd: 0,
    rateBps: 500,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: null,
    contractRequired: false,
    listPriceLabel: "0 VND",
    rateLabel: "5%",
  },
  {
    code: "shipper-pro-monthly",
    audience: "SHIPPER",
    name: "Pro Monthly",
    billingCycle: "MONTH",
    priceVnd: 799_000,
    rateBps: 400,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: null,
    contractRequired: false,
    listPriceLabel: "799.000 VND/tháng",
    rateLabel: "4%",
  },
  {
    code: "shipper-pro-annual",
    audience: "SHIPPER",
    name: "Pro Annual",
    billingCycle: "YEAR",
    priceVnd: 7_990_000,
    rateBps: 350,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: null,
    contractRequired: false,
    listPriceLabel: "7.990.000 VND/năm",
    rateLabel: "3,5%",
  },
  {
    code: "shipper-enterprise",
    audience: "SHIPPER",
    name: "Enterprise",
    billingCycle: "MONTH",
    priceVnd: 6_990_000,
    rateBps: 250,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: null,
    contractRequired: false,
    listPriceLabel: "6.990.000 VND/tháng",
    rateLabel: "2,5%",
  },
  {
    code: "carrier-free",
    audience: "CARRIER",
    name: "Free",
    billingCycle: "NONE",
    priceVnd: 0,
    rateBps: 500,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: 2,
    contractRequired: false,
    listPriceLabel: "0 VND",
    rateLabel: "5%",
  },
  {
    code: "carrier-pro-monthly",
    audience: "CARRIER",
    name: "Pro Monthly",
    billingCycle: "MONTH",
    priceVnd: 999_000,
    rateBps: 400,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: 10,
    contractRequired: false,
    listPriceLabel: "999.000 VND/tháng",
    rateLabel: "4%",
  },
  {
    code: "carrier-pro-annual",
    audience: "CARRIER",
    name: "Pro Annual",
    billingCycle: "YEAR",
    priceVnd: 9_990_000,
    rateBps: 350,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: 10,
    contractRequired: false,
    listPriceLabel: "9.990.000 VND/năm",
    rateLabel: "3,5%",
  },
  {
    code: "carrier-business",
    audience: "CARRIER",
    name: "Business",
    billingCycle: "MONTH",
    priceVnd: 2_990_000,
    rateBps: 300,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: 30,
    contractRequired: false,
    listPriceLabel: "2.990.000 VND/tháng",
    rateLabel: "3%",
  },
  {
    code: "carrier-enterprise",
    audience: "CARRIER",
    name: "Enterprise",
    billingCycle: "MONTH",
    priceVnd: 7_990_000,
    rateBps: 200,
    rateMinBps: null,
    rateMaxBps: null,
    vehicleCap: 100,
    contractRequired: false,
    listPriceLabel: "7.990.000 VND/tháng",
    rateLabel: "2%",
  },
];

const byCode = new Map(planCatalog.map((plan) => [plan.code, plan]));

export function planByCode(code: string): PlanSpec | undefined {
  return byCode.get(code);
}

export function freePlan(audience: PlanAudience): PlanSpec {
  const plan = planByCode(audience === "SHIPPER" ? "shipper-free" : "carrier-free");
  if (!plan || plan.priceVnd === null || plan.rateBps === null) {
    throw new Error("Free plan catalog is incomplete.");
  }
  return plan;
}

export function toCatalogDto(plan: PlanSpec) {
  return {
    code: plan.code,
    audience: plan.audience,
    name: plan.name,
    billingCycle: plan.billingCycle,
    priceVnd: plan.priceVnd,
    rateBps: plan.rateBps,
    vehicleCap: plan.vehicleCap,
    contractRequired: plan.contractRequired,
    quoteRequired: plan.contractRequired,
    listPriceLabel: plan.listPriceLabel,
    rateLabel: plan.rateLabel,
    paymentCollected: false,
  };
}
