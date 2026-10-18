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

const tierOrder = ["free", "pro", "business", "enterprise"] as const;

export type VisualTierId = (typeof tierOrder)[number];

export type VisualTier = {
  id: VisualTierId;
  title: string;
  plans: CatalogPlan[];
};

export function visualTierId(code: string): VisualTierId | null {
  if (code.endsWith("-free")) return "free";
  if (code.includes("-pro-")) return "pro";
  if (code.endsWith("-business")) return "business";
  if (code.endsWith("-enterprise")) return "enterprise";
  return null;
}

export function visualTiers(plans: readonly CatalogPlan[]): VisualTier[] {
  const grouped = new Map<VisualTierId, CatalogPlan[]>();
  for (const plan of plans) {
    const id = visualTierId(plan.code);
    if (!id) continue;
    const list = grouped.get(id) ?? [];
    list.push(plan);
    grouped.set(id, list);
  }
  return tierOrder.flatMap((id) => {
    const list = grouped.get(id);
    if (!list || list.length === 0) return [];
    const ordered = [...list].sort((left, right) => billingRank(left) - billingRank(right) || left.code.localeCompare(right.code));
    return [{ id, title: id === "pro" ? "Pro" : planTitle(ordered[0]), plans: ordered }];
  });
}

function billingRank(plan: Pick<CatalogPlan, "billingCycle">): number {
  if (plan.billingCycle === "MONTH") return 0;
  if (plan.billingCycle === "YEAR") return 1;
  return 2;
}

export function billingChoiceLabel(plan: Pick<CatalogPlan, "billingCycle">): string {
  if (plan.billingCycle === "YEAR") return "Theo năm";
  if (plan.billingCycle === "MONTH") return "Theo tháng";
  return "Không theo chu kỳ";
}

export function annualComparisonNote(plan: Pick<CatalogPlan, "priceVnd" | "billingCycle">): string | null {
  if (plan.billingCycle !== "YEAR" || plan.priceVnd == null) return null;
  const perMonth = Math.round(plan.priceVnd / 12);
  return `Khoảng ${formatVnd(perMonth)}/tháng chỉ để đối chiếu. Số niêm yết là ${formatVnd(plan.priceVnd)} mỗi năm.`;
}

export function tierExplanation(audience: PlanAudience): string {
  const fleet = audience === "CARRIER" ? " Với nhà xe, bậc cao hơn có trần xe ACTIVE lớn hơn." : "";
  return `Pro theo tháng và Pro theo năm là hai cách trả tiền của cùng một bậc, không phải hai hạng gói. Hoa hồng của hai cách trả này khác nhau. Bậc cao hơn có thể có hoa hồng thấp hơn.${fleet}`;
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
