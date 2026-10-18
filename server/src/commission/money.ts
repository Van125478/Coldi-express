export class CommissionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommissionInputError";
  }
}

export function assertBaseVnd(value: unknown): bigint {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new CommissionInputError("Giá cước phải là số nguyên dương trong giới hạn an toàn.");
  }
  return BigInt(value);
}

export function assertRateBps(value: unknown): bigint {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 10_000) {
    throw new CommissionInputError("Tỷ lệ hoa hồng phải là số nguyên basis point từ 0 đến 10000.");
  }
  return BigInt(value);
}

/** Round half up to 1 VND. Each side is rounded on its own. */
export function roundHalfUpFee(baseVnd: number, rateBps: number): number {
  const base = assertBaseVnd(baseVnd);
  const rate = assertRateBps(rateBps);
  const fee = (base * rate + 5_000n) / 10_000n;
  const asNumber = Number(fee);
  if (!Number.isSafeInteger(asNumber) || asNumber < 0) {
    throw new CommissionInputError("Kết quả hoa hồng không phải số nguyên an toàn.");
  }
  return asNumber;
}

export function quoteBothSides(baseVnd: number, shipperRateBps: number, carrierRateBps: number) {
  const shipperFeeVnd = roundHalfUpFee(baseVnd, shipperRateBps);
  const carrierFeeVnd = roundHalfUpFee(baseVnd, carrierRateBps);
  return {
    shipperFeeVnd,
    carrierFeeVnd,
    shipperTotalVnd: baseVnd + shipperFeeVnd,
    carrierNetVnd: baseVnd - carrierFeeVnd,
    platformGrossEstimateVnd: shipperFeeVnd + carrierFeeVnd,
    paymentCollected: false as const,
  };
}
