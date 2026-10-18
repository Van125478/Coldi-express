export const payerSides = ["SHIPPER", "CARRIER"] as const;
export type PayerSide = (typeof payerSides)[number];

export const commissionStatuses = ["ABSENT", "ESTIMATED", "ACCRUED", "VOID", "ON_HOLD"] as const;
export type CommissionStatus = (typeof commissionStatuses)[number];

export type AdjustmentEvent = {
  payerSide: PayerSide;
  deltaVnd: number;
  idempotencyKey: string;
};

export function voidEstimated(status: CommissionStatus): CommissionStatus {
  if (status === "ABSENT") return "ABSENT";
  if (status === "ESTIMATED") return "VOID";
  throw new Error("Chỉ ước tính chưa giao mới có thể hủy.");
}

export function holdAccrued(status: CommissionStatus): CommissionStatus {
  if (status !== "ACCRUED") throw new Error("Chỉ khoản đã ghi nhận mới có thể tạm giữ.");
  return "ON_HOLD";
}

export function releaseHold(status: CommissionStatus): CommissionStatus {
  if (status !== "ON_HOLD") throw new Error("Chỉ khoản đang tạm giữ mới có thể mở lại.");
  return "ACCRUED";
}

export function effectiveFee(originalAccrualVnd: number, adjustments: readonly AdjustmentEvent[], side: PayerSide): number {
  if (!Number.isSafeInteger(originalAccrualVnd) || originalAccrualVnd < 0) {
    throw new Error("Khoản ghi nhận gốc không hợp lệ.");
  }
  const seen = new Set<string>();
  let total = originalAccrualVnd;
  for (const adjustment of adjustments) {
    if (adjustment.payerSide !== side) continue;
    if (seen.has(adjustment.idempotencyKey)) continue;
    seen.add(adjustment.idempotencyKey);
    if (!Number.isSafeInteger(adjustment.deltaVnd)) throw new Error("Điều chỉnh phải là số nguyên.");
    const next = total + adjustment.deltaVnd;
    if (!Number.isSafeInteger(next) || next < 0) throw new Error("Phí hiệu lực không được âm.");
    total = next;
  }
  return total;
}
