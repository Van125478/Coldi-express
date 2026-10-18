import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { AccountSubscription, ContractTerms, PlanAuditEvent, PlanVersion } from "../models/package.js";
import { User } from "../models/user.js";
import { planByCode, type BillingCycle, type PlanSpec } from "./catalog.js";
import { isEffectivePaid, resolveAccountEntitlements, type AccountEntitlements } from "./entitlements.js";
import { ensurePublishedCatalog } from "./publishCatalog.js";

const idempotencyPattern = /^[A-Za-z0-9._:-]{8,80}$/;

export type ContractInput = {
  priceVnd: number;
  rateBps: number;
  vehicleCap?: number | null;
};

export async function activateDemoPlan(accountId: string, planCode: string, idempotencyKey: string, contract: ContractInput | null, now = new Date()) {
  assertDemoOpen();
  const key = readIdempotencyKey(idempotencyKey);
  const user = await User.findById(accountId).select("role");
  if (!user || (user.role !== "SHIPPER" && user.role !== "CARRIER")) {
    throw new HttpError(403, "forbidden", "Chỉ chủ hàng hoặc nhà xe mới kích hoạt gói trong môi trường Demo/QA.");
  }
  const plan = planByCode(planCode);
  if (!plan || plan.audience !== user.role || plan.code.endsWith("-free")) {
    throw new HttpError(400, "plan_not_available", "Gói này không dùng cho tài khoản hiện tại.");
  }
  const terms = materializeTerms(plan, contract);
  await ensurePublishedCatalog();
  const version = await PlanVersion.findOne({ planCode: plan.code, revision: 1, status: "PUBLISHED" });
  if (!version) throw new HttpError(503, "plan_unavailable", "Danh mục gói chưa sẵn sàng.");

  const replay = await PlanAuditEvent.findOne({ accountId, idempotencyKey: key, action: "DEMO_ACTIVATED" });
  if (replay) return activationPayload(await resolveAccountEntitlements(accountId, now));

  const existing = await AccountSubscription.findOne({ accountId });
  if (existing && isEffectivePaid(existing, now)) {
    if (sameCommercialTerms(existing, plan.code, terms)) return activationPayload(await resolveAccountEntitlements(accountId, now));
    throw new HttpError(409, "plan_change_unsupported", "Đổi giữa hai gói trả phí trong kỳ hạn chưa được duyệt. Có thể đặt lịch về Free khi hết kỳ.");
  }

  const environmentId = process.env.PACKAGE_DEMO_DEPLOYMENT_ID?.trim() ?? "";
  const fields = {
    role: user.role,
    planCode: plan.code,
    planVersionId: version._id,
    priceVnd: terms.priceVnd,
    rateBps: terms.rateBps,
    vehicleCap: terms.vehicleCap,
    billingCycle: plan.billingCycle,
    startAt: now,
    endAt: addBillingCycle(now, plan.billingCycle),
    activationSource: "DEMO_QA" as const,
    environmentId,
    downgradeToFreeAt: null,
    lastIdempotencyKey: key,
  };

  let subscription = existing;
  if (existing) {
    subscription = await AccountSubscription.findOneAndUpdate(
      { _id: existing._id, revision: existing.revision, endAt: { $lte: now } },
      { $set: fields, $inc: { revision: 1 } },
      { returnDocument: "after" },
    );
    if (!subscription) {
      throw new HttpError(409, "plan_activation_conflict", "Một yêu cầu kích hoạt khác vừa được ghi. Hãy tải lại gói hiện tại.");
    }
  } else {
    try {
      subscription = await AccountSubscription.create({ accountId, revision: 1, ...fields });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const raced = await PlanAuditEvent.findOne({ accountId, idempotencyKey: key, action: "DEMO_ACTIVATED" });
      if (raced) return activationPayload(await resolveAccountEntitlements(accountId, now));
      throw new HttpError(409, "plan_activation_conflict", "Một yêu cầu kích hoạt khác vừa được ghi. Hãy tải lại gói hiện tại.");
    }
  }

  if (plan.contractRequired && subscription) {
    const contractDoc = await ContractTerms.create({
      accountId,
      planCode: plan.code,
      priceVnd: terms.priceVnd,
      rateBps: terms.rateBps,
      vehicleCap: terms.vehicleCap,
    });
    await AccountSubscription.updateOne({ _id: subscription._id }, { contractTermsId: contractDoc._id });
  }

  try {
    await PlanAuditEvent.create({
      accountId,
      actorId: accountId,
      actorRole: user.role,
      action: "DEMO_ACTIVATED",
      idempotencyKey: key,
      planCode: plan.code,
      planVersionId: version._id,
      activationSource: "DEMO_QA",
      paymentCollected: false,
      recordedAt: now,
    });
  } catch (error) {
    if (!isDuplicate(error)) console.error("Package audit was not stored for demo activation.");
  }

  return activationPayload(await resolveAccountEntitlements(accountId, now));
}

export async function scheduleDowngradeToFree(accountId: string, idempotencyKey: string, now = new Date()) {
  const key = readIdempotencyKey(idempotencyKey);
  const user = await User.findById(accountId).select("role");
  if (!user || (user.role !== "SHIPPER" && user.role !== "CARRIER")) {
    throw new HttpError(403, "forbidden", "Tài khoản này không có gói để hạ.");
  }
  const replay = await PlanAuditEvent.findOne({ accountId, idempotencyKey: key, action: "DOWNGRADE_SCHEDULED" });
  if (replay) return activationPayload(await resolveAccountEntitlements(accountId, now));

  const existing = await AccountSubscription.findOne({ accountId });
  if (!existing || !isEffectivePaid(existing, now)) {
    throw new HttpError(409, "plan_change_unsupported", "Chỉ gói trả phí đang còn hạn mới đặt lịch về Free vào cuối kỳ.");
  }
  if (existing.downgradeToFreeAt) return activationPayload(await resolveAccountEntitlements(accountId, now));

  const updated = await AccountSubscription.findOneAndUpdate(
    { _id: existing._id, revision: existing.revision },
    { $set: { downgradeToFreeAt: existing.endAt, lastIdempotencyKey: key }, $inc: { revision: 1 } },
    { returnDocument: "after" },
  );
  if (!updated) throw new HttpError(409, "plan_activation_conflict", "Gói vừa thay đổi. Hãy tải lại trước khi đặt lịch.");

  try {
    await PlanAuditEvent.create({
      accountId,
      actorId: accountId,
      actorRole: user.role,
      action: "DOWNGRADE_SCHEDULED",
      idempotencyKey: key,
      planCode: existing.planCode,
      planVersionId: existing.planVersionId,
      activationSource: "SCHEDULED_DOWNGRADE",
      paymentCollected: false,
      recordedAt: now,
    });
  } catch (error) {
    if (!isDuplicate(error)) console.error("Package audit was not stored for scheduled downgrade.");
  }
  return activationPayload(await resolveAccountEntitlements(accountId, now));
}

export function materializeTerms(plan: PlanSpec, contract: ContractInput | null): { priceVnd: number; rateBps: number; vehicleCap: number | null } {
  if (!plan.contractRequired) {
    if (contract) throw new HttpError(400, "invalid_request", "Gói cố định không nhận điều khoản hợp đồng.");
    if (plan.priceVnd === null || plan.rateBps === null) throw new HttpError(500, "plan_unavailable", "Gói cố định thiếu giá đã phát hành.");
    return { priceVnd: plan.priceVnd, rateBps: plan.rateBps, vehicleCap: plan.vehicleCap };
  }
  if (!contract) {
    throw new HttpError(409, "quote_required", "Gói theo hợp đồng cần giá, tỷ lệ và hạn mức cụ thể. Không dùng mức giữa của khoảng giá.");
  }
  if (!Number.isInteger(contract.priceVnd) || contract.priceVnd < 0) {
    throw new HttpError(400, "invalid_request", "Giá hợp đồng phải là số VND nguyên không âm.");
  }
  if (!Number.isInteger(contract.rateBps) || plan.rateMinBps === null || plan.rateMaxBps === null || contract.rateBps < plan.rateMinBps || contract.rateBps > plan.rateMaxBps) {
    throw new HttpError(400, "invalid_request", "Tỷ lệ hợp đồng phải là basis point nguyên nằm trong khoảng đã công bố. Không tự lấy điểm giữa.");
  }
  if (plan.code === "carrier-business") {
    if (contract.vehicleCap != null && contract.vehicleCap !== 30) {
      throw new HttpError(400, "invalid_request", "Gói Business có trần 30 xe hoạt động. Không đổi trần này bằng hợp đồng demo.");
    }
    return { priceVnd: contract.priceVnd, rateBps: contract.rateBps, vehicleCap: 30 };
  }
  if (plan.code === "carrier-enterprise") {
    if (!Number.isInteger(contract.vehicleCap) || contract.vehicleCap == null || contract.vehicleCap < 1) {
      throw new HttpError(409, "quote_required", "Gói Enterprise của nhà xe cần trần xe cụ thể trong hợp đồng.");
    }
    return { priceVnd: contract.priceVnd, rateBps: contract.rateBps, vehicleCap: contract.vehicleCap };
  }
  if (contract.vehicleCap != null) {
    throw new HttpError(400, "invalid_request", "Gói chủ hàng không đặt trần xe.");
  }
  return { priceVnd: contract.priceVnd, rateBps: contract.rateBps, vehicleCap: null };
}

function activationPayload(entitlements: AccountEntitlements) {
  return {
    paymentCollected: false as const,
    label: "Demo — không phát sinh thanh toán",
    entitlements,
  };
}

function sameCommercialTerms(
  existing: { planCode: string; priceVnd: number; rateBps: number; vehicleCap?: number | null },
  planCode: string,
  terms: { priceVnd: number; rateBps: number; vehicleCap: number | null },
) {
  return existing.planCode === planCode && existing.priceVnd === terms.priceVnd && existing.rateBps === terms.rateBps && (existing.vehicleCap ?? null) === terms.vehicleCap;
}

function assertDemoOpen() {
  if (!getEnv().demoSelfActivationAllowed) {
    throw new HttpError(403, "demo_activation_unavailable", "Môi trường này không được tự kích hoạt gói trả phí.");
  }
}

function readIdempotencyKey(value: string): string {
  if (!idempotencyPattern.test(value)) {
    throw new HttpError(400, "invalid_request", "Thiếu mã idempotency hợp lệ.");
  }
  return value;
}

function addBillingCycle(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start.getTime());
  if (cycle === "YEAR") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
