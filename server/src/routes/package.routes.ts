import { Router } from "express";
import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireOperationalSession } from "../middlewares/requireOperational.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import { activateDemoPlan, scheduleDowngradeToFree, type ContractInput } from "../packages/activation.js";
import { planCatalog, toCatalogDto } from "../packages/catalog.js";
import { resolveAccountEntitlements } from "../packages/entitlements.js";
import { ensurePublishedCatalog } from "../packages/publishCatalog.js";

export const packageRouter = Router();

packageRouter.get("/catalog", async (_request, response, next) => {
  try {
    await ensurePublishedCatalog();
    response.status(200).json({ plans: planCatalog.map(toCatalogDto) });
  } catch (error) {
    next(error);
  }
});

packageRouter.get("/my-plan", requireAuth, requireOperationalSession, requireRole("SHIPPER", "CARRIER"), async (request, response, next) => {
  try {
    const entitlements = await resolveAccountEntitlements(accountId(request.authUser?.id));
    response.status(200).json({ plan: planView(entitlements), entitlements });
  } catch (error) {
    next(error);
  }
});

packageRouter.get("/my-plan/entitlements", requireAuth, requireOperationalSession, requireRole("SHIPPER", "CARRIER"), async (request, response, next) => {
  try {
    response.status(200).json({ entitlements: await resolveAccountEntitlements(accountId(request.authUser?.id)) });
  } catch (error) {
    next(error);
  }
});

packageRouter.post("/my-plan/schedule-downgrade", requireAuth, requireOperationalSession, requireTrustedOrigin, requireRole("SHIPPER", "CARRIER"), async (request, response, next) => {
  try {
    const body = readObject(request.body);
    rejectForeignAccount(body);
    const result = await scheduleDowngradeToFree(accountId(request.authUser?.id), readKey(body));
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

if (getEnv().demoSelfActivationAllowed) {
  packageRouter.post("/my-plan/demo-activate", requireAuth, requireOperationalSession, requireTrustedOrigin, requireRole("SHIPPER", "CARRIER"), async (request, response, next) => {
    try {
      if (!getEnv().demoSelfActivationAllowed) {
        throw new HttpError(403, "demo_activation_unavailable", "Môi trường này không được tự kích hoạt gói trả phí.");
      }
      const body = readObject(request.body);
      rejectForeignAccount(body);
      const planCode = body.planCode;
      if (typeof planCode !== "string") throw new HttpError(400, "invalid_request", "Thiếu mã gói.");
      const result = await activateDemoPlan(accountId(request.authUser?.id), planCode, readKey(body), readContract(body));
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });
}

function planView(entitlements: Awaited<ReturnType<typeof resolveAccountEntitlements>>) {
  return {
    code: entitlements.planCode,
    name: entitlements.planName,
    priceVnd: entitlements.priceVnd,
    rateBps: entitlements.rateBps,
    vehicleCap: entitlements.vehicleCap,
    startsAt: entitlements.startsAt,
    endsAt: entitlements.endsAt,
    scheduledDowngradeAt: entitlements.scheduledDowngradeAt,
    activationSource: entitlements.activationSource,
    paymentCollected: false,
    demo: entitlements.activationSource === "DEMO_QA",
    label: entitlements.activationSource === "DEMO_QA" ? "Demo — không phát sinh thanh toán" : "Gói Free mặc định",
  };
}

function accountId(id: string | undefined): string {
  if (!id) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
  return id;
}

function readObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Yêu cầu không hợp lệ.");
  }
  return body as Record<string, unknown>;
}

function rejectForeignAccount(body: Record<string, unknown>) {
  if ("accountId" in body || "rateBps" in body || "priceVnd" in body || "vehicleCap" in body) {
    throw new HttpError(400, "invalid_request", "Tài khoản và mức phí do máy chủ quyết định.");
  }
}

function readKey(body: Record<string, unknown>): string {
  if (typeof body.idempotencyKey !== "string") throw new HttpError(400, "invalid_request", "Thiếu mã idempotency hợp lệ.");
  return body.idempotencyKey;
}

function readContract(body: Record<string, unknown>): ContractInput | null {
  if (!("contract" in body) || body.contract == null) return null;
  if (typeof body.contract !== "object" || Array.isArray(body.contract)) {
    throw new HttpError(400, "invalid_request", "Điều khoản hợp đồng không hợp lệ.");
  }
  const contract = body.contract as Record<string, unknown>;
  if (typeof contract.priceVnd !== "number" || typeof contract.rateBps !== "number") {
    throw new HttpError(400, "invalid_request", "Hợp đồng cần giá VND và tỷ lệ basis point cụ thể.");
  }
  const vehicleCap = "vehicleCap" in contract ? contract.vehicleCap : null;
  if (vehicleCap != null && typeof vehicleCap !== "number") {
    throw new HttpError(400, "invalid_request", "Trần xe hợp đồng không hợp lệ.");
  }
  return { priceVnd: contract.priceVnd, rateBps: contract.rateBps, vehicleCap: typeof vehicleCap === "number" ? vehicleCap : null };
}
