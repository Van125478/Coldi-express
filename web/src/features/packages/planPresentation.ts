import { formatRate, formatVnd, formatWhen } from "./formatPlan";

export type PlanAudience = "SHIPPER" | "CARRIER";

export type CatalogPlan = {
  code: string;
  audience: PlanAudience;
  name: string;
  billingCycle: "NONE" | "MONTH" | "YEAR";
  priceVnd: number | null;
  rateBps: number | null;
  vehicleCap: number | null;
  contractRequired: boolean;
  quoteRequired: boolean;
  listPriceLabel: string;
  rateLabel: string;
  paymentCollected: boolean;
};

const titles: Record<string, string> = {
  "shipper-free": "Free",
  "shipper-pro-monthly": "Pro tháng",
  "shipper-pro-annual": "Pro năm",
  "shipper-enterprise": "Enterprise",
  "carrier-free": "Free",
  "carrier-pro-monthly": "Pro tháng",
  "carrier-pro-annual": "Pro năm",
  "carrier-business": "Business",
  "carrier-enterprise": "Enterprise",
};

export function planTitle(plan: Pick<CatalogPlan, "code" | "name">): string {
  return titles[plan.code] ?? plan.name;
}

export function isProPlan(plan: Pick<CatalogPlan, "code">): boolean {
  return plan.code.includes("-pro-");
}

export function priceBlock(plan: Pick<CatalogPlan, "priceVnd" | "billingCycle" | "quoteRequired" | "listPriceLabel">): {
  amount: string;
  cycle: string;
  quoted: boolean;
} {
  if (plan.quoteRequired || plan.priceVnd == null) {
    return { amount: plan.listPriceLabel, cycle: "Báo giá theo hợp đồng", quoted: true };
  }
  const cycle = plan.billingCycle === "YEAR" ? "Mỗi năm" : plan.billingCycle === "MONTH" ? "Mỗi tháng" : "Không theo chu kỳ";
  return { amount: formatVnd(plan.priceVnd), cycle, quoted: false };
}

export function commissionText(plan: Pick<CatalogPlan, "rateBps" | "rateLabel">): string {
  if (plan.rateBps == null) return plan.rateLabel;
  return formatRate(plan.rateBps);
}

export function vehicleCapText(plan: Pick<CatalogPlan, "audience" | "vehicleCap">): string | null {
  if (plan.audience === "SHIPPER") return null;
  if (plan.vehicleCap == null) return "Trần xe theo hợp đồng";
  return `${plan.vehicleCap} xe ACTIVE`;
}

export function operatingVehicleText(activeVehicleCount: number, vehicleCap: number | null): string {
  if (vehicleCap == null) return `${activeVehicleCount} xe đang hoạt động · trần theo hợp đồng`;
  return `${activeVehicleCount}/${vehicleCap} xe đang hoạt động`;
}

export function activeVehicleText(activeVehicleCount: number, vehicleCap: number | null): string {
  if (vehicleCap == null) return `${activeVehicleCount} xe ACTIVE · trần theo hợp đồng`;
  return `${activeVehicleCount} / ${vehicleCap} xe ACTIVE`;
}

export function paymentNote(plans: readonly Pick<CatalogPlan, "paymentCollected">[]): string | null {
  if (plans.length === 0 || plans.some((plan) => plan.paymentCollected)) return null;
  return "Website chưa thu tiền. Giá trên bảng là niêm yết, không phải giao dịch đã thanh toán.";
}

export type TermTone = "open" | "expired" | "perpetual";

export function termCopy(endsAt: string | null, now: Date): { tone: TermTone; label: string; until: string } {
  if (!endsAt) return { tone: "perpetual", label: "Không thời hạn", until: "Không thời hạn" };
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return { tone: "perpetual", label: "Không thời hạn", until: "Không thời hạn" };
  const until = formatWhen(endsAt);
  if (date.getTime() <= now.getTime()) return { tone: "expired", label: "Đã hết hạn", until };
  return { tone: "open", label: "Còn hiệu lực", until };
}
