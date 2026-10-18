import { Types } from "mongoose";
import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { AccountSubscription, ContractTerms, DemoContractGrant, PlanAuditEvent, PlanVersion } from "../models/package.js";
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

type AuditEntry = {
  action: "DEMO_ACTIVATED" | "DOWNGRADE_SCHEDULED" | "DEMO_ENDED";
  idempotencyKey: string;
  actorId: string;
  actorRole: "SHIPPER" | "CARRIER";
  planCode: string;
  planVersionId: Types.ObjectId;
  activationSource: "DEMO_QA" | "SCHEDULED_DOWNGRADE" | "DEMO_ENDED";
  paymentCollected: false;
  recordedAt: Date;
};

export async function grantAuthorizedDemoContract(accountId: string, planCode: string, contract: ContractInput): Promise<void> {
  assertDemoOpen();
  const plan = planByCode(planCode);
  if (!plan?.contractRequired) {
    throw new HttpError(400, "invalid_request", "Chỉ gói theo hợp đồng mới nhận điều khoản đã phê duyệt.");
  }
  const user = await User.findById(accountId).select("role");
  if (!user || user.role !== plan.audience) {
    throw new HttpError(400, "plan_not_available", "Điều khoản không khớp loại tài khoản.");
  }
  const terms = materializeTerms(plan, contract);
  await DemoContractGrant.findOneAndUpdate(
    { accountId, planCode: plan.code, environmentId: deploymentId() },
    {
      $set: {
        priceVnd: terms.priceVnd,
        rateBps: terms.rateBps,
        vehicleCap: terms.vehicleCap,
        authorizedBy: "QA_FIXTURE",
      },
    },
    { upsert: true },
  );
}

export async function activateDemoPlan(accountId: string, planCode: string, idempotencyKey: string, now = new Date()) {
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
  const terms = await authorizedTerms(plan, accountId);
  await ensurePublishedCatalog();
  const version = await latestPublishedVersion(plan.code);
  if (!version) throw new HttpError(503, "plan_unavailable", "Danh mục gói chưa sẵn sàng.");

  if (await hasAudit(accountId, key, "DEMO_ACTIVATED")) {
    await repairPlanAudits(accountId);
    return activationPayload(await resolveAccountEntitlements(accountId, now));
  }

  const existing = await AccountSubscription.findOne({ accountId });
  if (existing && isEffectivePaid(existing, now)) {
    if (sameCommercialTerms(existing, plan.code, terms)) return activationPayload(await resolveAccountEntitlements(accountId, now));
    throw new HttpError(409, "plan_change_unsupported", "Đổi giữa hai gói trả phí trong kỳ hạn chưa được duyệt. Có thể đặt lịch về Free khi hết kỳ.");
  }

  const contractTermsId = await contractRecord(plan, accountId, terms);
  const audit = auditEntry("DEMO_ACTIVATED", key, accountId, user.role, plan.code, version._id, "DEMO_QA", now);
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
    environmentId: deploymentId(),
    downgradeToFreeAt: null,
    lastIdempotencyKey: key,
    ...(contractTermsId ? { contractTermsId } : {}),
  };

  if (existing) {
    const updated = await AccountSubscription.findOneAndUpdate(
      { _id: existing._id, revision: existing.revision, endAt: { $lte: now }, "audits.idempotencyKey": { $ne: key } },
      { $set: fields, $inc: { revision: 1 }, $push: { audits: audit } },
      { returnDocument: "after" },
    );
    if (!updated) {
      if (await hasAudit(accountId, key, "DEMO_ACTIVATED")) {
        await repairPlanAudits(accountId);
        return activationPayload(await resolveAccountEntitlements(accountId, now));
      }
      throw new HttpError(409, "plan_activation_conflict", "Một yêu cầu kích hoạt khác vừa được ghi. Hãy tải lại gói hiện tại.");
    }
  } else {
    try {
      await AccountSubscription.create({ accountId, revision: 1, ...fields, audits: [audit] });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      if (await hasAudit(accountId, key, "DEMO_ACTIVATED")) {
        await repairPlanAudits(accountId);
        return activationPayload(await resolveAccountEntitlements(accountId, now));
      }
      throw new HttpError(409, "plan_activation_conflict", "Một yêu cầu kích hoạt khác vừa được ghi. Hãy tải lại gói hiện tại.");
    }
  }

  await projectAudit(accountId, audit);
  if (!(await hasAudit(accountId, key, "DEMO_ACTIVATED"))) {
    throw new HttpError(503, "audit_unavailable", "Chưa ghi được nhật ký gói. Hãy thử lại cùng mã idempotency.");
  }
  return activationPayload(await resolveAccountEntitlements(accountId, now));
}

export async function scheduleDowngradeToFree(accountId: string, idempotencyKey: string, now = new Date()) {
  const key = readIdempotencyKey(idempotencyKey);
  const user = await User.findById(accountId).select("role");
  if (!user || (user.role !== "SHIPPER" && user.role !== "CARRIER")) {
    throw new HttpError(403, "forbidden", "Tài khoản này không có gói để hạ.");
  }
  if (await hasAudit(accountId, key, "DOWNGRADE_SCHEDULED")) {
    await repairPlanAudits(accountId);
    return activationPayload(await resolveAccountEntitlements(accountId, now));
  }

  const existing = await AccountSubscription.findOne({ accountId });
  if (!existing || !isEffectivePaid(existing, now)) {
    throw new HttpError(409, "plan_change_unsupported", "Chỉ gói trả phí đang còn hạn mới đặt lịch về Free vào cuối kỳ.");
  }
  if (existing.downgradeToFreeAt) return activationPayload(await resolveAccountEntitlements(accountId, now));

  const audit = auditEntry("DOWNGRADE_SCHEDULED", key, accountId, user.role, existing.planCode, existing.planVersionId, "SCHEDULED_DOWNGRADE", now);
  const updated = await AccountSubscription.findOneAndUpdate(
    { _id: existing._id, revision: existing.revision, "audits.idempotencyKey": { $ne: key } },
    { $set: { downgradeToFreeAt: existing.endAt, lastIdempotencyKey: key }, $inc: { revision: 1 }, $push: { audits: audit } },
    { returnDocument: "after" },
  );
  if (!updated) {
    if (await hasAudit(accountId, key, "DOWNGRADE_SCHEDULED")) {
      await repairPlanAudits(accountId);
      return activationPayload(await resolveAccountEntitlements(accountId, now));
    }
    throw new HttpError(409, "plan_activation_conflict", "Gói vừa thay đổi. Hãy tải lại trước khi đặt lịch.");
  }
  await projectAudit(accountId, audit);
  if (!(await hasAudit(accountId, key, "DOWNGRADE_SCHEDULED"))) {
    throw new HttpError(503, "audit_unavailable", "Chưa ghi được nhật ký gói. Hãy thử lại cùng mã idempotency.");
  }
  return activationPayload(await resolveAccountEntitlements(accountId, now));
}

export async function endDemoPlanNow(accountId: string, idempotencyKey: string, now = new Date()) {
  assertDemoOpen();
  const key = readIdempotencyKey(idempotencyKey);
  const user = await User.findById(accountId).select("role");
  if (!user || (user.role !== "SHIPPER" && user.role !== "CARRIER")) {
    throw new HttpError(403, "forbidden", "Chỉ chủ hàng hoặc nhà xe mới kết thúc gói Demo của chính mình.");
  }
  if (await hasAudit(accountId, key, "DEMO_ENDED")) {
    await repairPlanAudits(accountId);
    return activationPayload(await resolveAccountEntitlements(accountId, now));
  }

  const existing = await AccountSubscription.findOne({ accountId });
  if (!existing || !isEffectivePaid(existing, now)) {
    return activationPayload(await resolveAccountEntitlements(accountId, now));
  }

  const audit = auditEntry("DEMO_ENDED", key, accountId, user.role, existing.planCode, existing.planVersionId, "DEMO_ENDED", now);
  const updated = await AccountSubscription.findOneAndUpdate(
    { _id: existing._id, revision: existing.revision, "audits.idempotencyKey": { $ne: key } },
    { $set: { endAt: now, downgradeToFreeAt: null, lastIdempotencyKey: key }, $inc: { revision: 1 }, $push: { audits: audit } },
    { returnDocument: "after" },
  );
  if (!updated) {
    if (await hasAudit(accountId, key, "DEMO_ENDED")) {
      await repairPlanAudits(accountId);
      return activationPayload(await resolveAccountEntitlements(accountId, now));
    }
    const current = await AccountSubscription.findOne({ accountId });
    if (!current || !isEffectivePaid(current, now)) {
      return activationPayload(await resolveAccountEntitlements(accountId, now));
    }
    throw new HttpError(409, "plan_activation_conflict", "Gói vừa thay đổi. Hãy tải lại trước khi kết thúc bản Demo.");
  }
  await projectAudit(accountId, audit);
  if (!(await hasAudit(accountId, key, "DEMO_ENDED"))) {
    throw new HttpError(503, "audit_unavailable", "Chưa ghi được nhật ký gói. Hãy thử lại cùng mã idempotency.");
  }
  return activationPayload(await resolveAccountEntitlements(accountId, now));
}

export async function repairPlanAudits(accountId: string): Promise<number> {
  const subscription = await AccountSubscription.findOne({ accountId }).select("audits");
  const audits = subscription?.audits ?? [];
  let repaired = 0;
  for (const entry of audits) {
    const exists = await PlanAuditEvent.exists({ accountId, idempotencyKey: entry.idempotencyKey });
    if (exists) continue;
    try {
      await PlanAuditEvent.create({
        accountId,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        idempotencyKey: entry.idempotencyKey,
        planCode: entry.planCode,
        ...(entry.planVersionId ? { planVersionId: entry.planVersionId } : {}),
        activationSource: entry.activationSource,
        paymentCollected: false,
        recordedAt: entry.recordedAt,
      });
      repaired += 1;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  return repaired;
}

export function materializeTerms(plan: PlanSpec, contract: ContractInput | null): { priceVnd: number; rateBps: number; vehicleCap: number | null } {
  if (!plan.contractRequired) {
    if (contract) throw new HttpError(400, "invalid_request", "Gói cố định không nhận điều khoản hợp đồng.");
    if (plan.priceVnd === null || plan.rateBps === null) throw new HttpError(500, "plan_unavailable", "Gói cố định thiếu giá đã phát hành.");
    return { priceVnd: plan.priceVnd, rateBps: plan.rateBps, vehicleCap: plan.vehicleCap };
  }
  if (!contract) {
    throw new HttpError(409, "quote_required", "Gói theo hợp đồng cần điều khoản đã được máy chủ phê duyệt. Không dùng mức giữa của khoảng giá.");
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
      throw new HttpError(409, "quote_required", "Gói Enterprise của nhà xe cần trần xe cụ thể trong hợp đồng đã phê duyệt.");
    }
    return { priceVnd: contract.priceVnd, rateBps: contract.rateBps, vehicleCap: contract.vehicleCap };
  }
  if (contract.vehicleCap != null) {
    throw new HttpError(400, "invalid_request", "Gói chủ hàng không đặt trần xe.");
  }
  return { priceVnd: contract.priceVnd, rateBps: contract.rateBps, vehicleCap: null };
}

async function authorizedTerms(plan: PlanSpec, accountId: string) {
  if (!plan.contractRequired) return materializeTerms(plan, null);
  const grant = await DemoContractGrant.findOne({ accountId, planCode: plan.code, environmentId: deploymentId() });
  if (!grant) {
    throw new HttpError(409, "quote_required", "Gói theo hợp đồng cần điều khoản đã được máy chủ phê duyệt. Không dùng mức giữa của khoảng giá.");
  }
  return materializeTerms(plan, { priceVnd: grant.priceVnd, rateBps: grant.rateBps, vehicleCap: grant.vehicleCap ?? null });
}

async function contractRecord(plan: PlanSpec, accountId: string, terms: { priceVnd: number; rateBps: number; vehicleCap: number | null }) {
  if (!plan.contractRequired) return null;
  const doc = await ContractTerms.findOneAndUpdate(
    { accountId, planCode: plan.code, priceVnd: terms.priceVnd, rateBps: terms.rateBps, vehicleCap: terms.vehicleCap },
    { $setOnInsert: { accountId, planCode: plan.code, priceVnd: terms.priceVnd, rateBps: terms.rateBps, vehicleCap: terms.vehicleCap } },
    { upsert: true, returnDocument: "after" },
  );
  return doc?._id ?? null;
}

async function latestPublishedVersion(planCode: string) {
  return PlanVersion.findOne({ planCode, status: "PUBLISHED" }).sort({ revision: -1 });
}

async function hasAudit(accountId: string, idempotencyKey: string, action: AuditEntry["action"]): Promise<boolean> {
  const subscription = await AccountSubscription.exists({ accountId, audits: { $elemMatch: { idempotencyKey, action } } });
  return Boolean(subscription);
}

async function projectAudit(accountId: string, audit: AuditEntry): Promise<void> {
  try {
    await PlanAuditEvent.create({ accountId, ...audit });
  } catch (error) {
    if (isDuplicate(error)) return;
    try {
      await repairPlanAudits(accountId);
    } catch (repairError) {
      if (!isDuplicate(repairError)) {
        console.error("Package audit projection failed.");
      }
    }
  }
}

function auditEntry(
  action: AuditEntry["action"],
  idempotencyKey: string,
  actorId: string,
  actorRole: "SHIPPER" | "CARRIER",
  planCode: string,
  planVersionId: Types.ObjectId,
  activationSource: AuditEntry["activationSource"],
  recordedAt: Date,
): AuditEntry {
  return {
    action,
    idempotencyKey,
    actorId,
    actorRole,
    planCode,
    planVersionId,
    activationSource,
    paymentCollected: false,
    recordedAt,
  };
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

function deploymentId(): string {
  const value = process.env.PACKAGE_DEMO_DEPLOYMENT_ID?.trim() ?? "";
  if (value.length < 8) {
    throw new HttpError(403, "demo_activation_unavailable", "Môi trường này không được tự kích hoạt gói trả phí.");
  }
  return value;
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
