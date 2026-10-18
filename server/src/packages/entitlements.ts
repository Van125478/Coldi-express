import { isValidObjectId } from "mongoose";
import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { AccountSubscription, PlanVersion } from "../models/package.js";
import { User, type UserRole } from "../models/user.js";
import { Vehicle } from "../models/vehicle.js";
import { freePlan, planByCode, type PlanAudience, type PlanSpec } from "./catalog.js";
import { ensurePublishedCatalog } from "./publishCatalog.js";
import { activeVehicleFilter } from "./vehicleStatus.js";

export type AccountEntitlements = {
  accountId: string;
  role: UserRole;
  planCode: string | null;
  planName: string | null;
  planVersionId: string | null;
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

type SubscriptionRecord = {
  planCode: string;
  planVersionId: { toString(): string };
  priceVnd: number;
  rateBps: number;
  vehicleCap?: number | null;
  startAt: Date;
  endAt: Date;
  downgradeToFreeAt?: Date | null | undefined;
  activationSource: "DEMO_QA";
};

export function isEffectivePaid(subscription: SubscriptionRecord | null, now: Date): boolean {
  if (!subscription) return false;
  if (subscription.startAt.getTime() > now.getTime()) return false;
  if (subscription.endAt.getTime() <= now.getTime()) return false;
  if (subscription.downgradeToFreeAt && subscription.downgradeToFreeAt.getTime() <= now.getTime()) return false;
  return true;
}

export async function resolveAccountEntitlements(accountId: string, now = new Date()): Promise<AccountEntitlements> {
  if (!isValidObjectId(accountId)) {
    throw new HttpError(404, "not_found", "Không tìm thấy tài khoản.");
  }
  const user = await User.findById(accountId).select("role");
  if (!user) throw new HttpError(404, "not_found", "Không tìm thấy tài khoản.");
  const demoActivationAvailable = getEnv().demoSelfActivationAllowed && (user.role === "SHIPPER" || user.role === "CARRIER");
  if (user.role !== "SHIPPER" && user.role !== "CARRIER") {
    return {
      accountId,
      role: user.role,
      planCode: null,
      planName: null,
      planVersionId: null,
      priceVnd: null,
      rateBps: null,
      vehicleCap: null,
      activeVehicleCount: 0,
      overLimit: false,
      startsAt: null,
      endsAt: null,
      scheduledDowngradeAt: null,
      activationSource: "IMPLICIT_FREE",
      paymentCollected: false,
      demoActivationAvailable: false,
      shipmentQuota: null,
      premiumEntitlements: false,
    };
  }

  await ensurePublishedCatalog();
  const subscription = await AccountSubscription.findOne({ accountId });
  const paid = isEffectivePaid(subscription, now) ? subscription : null;
  const effective = paid ? paidPlan(paid.planCode) : freePlan(user.role);
  const version = await PlanVersion.findOne({ planCode: effective.code, revision: 1, status: "PUBLISHED" });
  const activeVehicleCount = user.role === "CARRIER" ? await Vehicle.countDocuments({ carrierId: accountId, ...activeVehicleFilter() }) : 0;
  const vehicleCap = user.role === "CARRIER" ? (paid ? (paid.vehicleCap ?? null) : effective.vehicleCap) : null;
  const rateBps = paid ? paid.rateBps : effective.rateBps;
  const priceVnd = paid ? paid.priceVnd : effective.priceVnd;
  return {
    accountId,
    role: user.role,
    planCode: effective.code,
    planName: effective.name,
    planVersionId: paid?.planVersionId.toString() ?? version?._id.toString() ?? null,
    priceVnd,
    rateBps,
    vehicleCap,
    activeVehicleCount,
    overLimit: vehicleCap != null && activeVehicleCount > vehicleCap,
    startsAt: paid ? paid.startAt.toISOString() : null,
    endsAt: paid ? paid.endAt.toISOString() : null,
    scheduledDowngradeAt: paid?.downgradeToFreeAt ? paid.downgradeToFreeAt.toISOString() : null,
    activationSource: paid ? "DEMO_QA" : "IMPLICIT_FREE",
    paymentCollected: false,
    demoActivationAvailable,
    shipmentQuota: null,
    premiumEntitlements: false,
  };
}

export async function assertCarrierMayClaim(carrierId: string, now = new Date()): Promise<void> {
  const entitlements = await resolveAccountEntitlements(carrierId, now);
  if (entitlements.overLimit) {
    throw new HttpError(
      409,
      "over_limit",
      "Nhà xe đang vượt số xe hoạt động của gói hiện tại. Hãy lưu trữ xe không dùng trước khi nhận chuyến mới. Các chuyến đã nhận vẫn được giữ.",
    );
  }
}

function paidPlan(code: string): PlanSpec {
  const plan = planByCode(code);
  if (!plan) throw new HttpError(409, "plan_unavailable", "Gói đã lưu không còn trong danh mục đã phát hành.");
  return plan;
}

export function isSubscriberRole(role: UserRole): role is PlanAudience {
  return role === "SHIPPER" || role === "CARRIER";
}
