import { Router } from "express";
import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireOperationalSession } from "../middlewares/requireOperational.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import { activateDemoPlan, scheduleDowngradeToFree } from "../packages/activation.js";
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
    rejectClientCommercialFields(body, ["idempotencyKey"]);
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
      rejectClientCommercialFields(body, ["planCode", "idempotencyKey"]);
      const planCode = body.planCode;
      if (typeof planCode !== "string") throw new HttpError(400, "invalid_request", "Thiếu mã gói.");
      const result = await activateDemoPlan(accountId(request.authUser?.id), planCode, readKey(body));
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

function rejectClientCommercialFields(body: Record<string, unknown>, allowed: string[]) {
  const permitted = new Set(allowed);
  if (Object.keys(body).some((key) => !permitted.has(key))) {
    throw new HttpError(400, "invalid_request", "Giá, tỷ lệ, trần xe và điều khoản hợp đồng do máy chủ phê duyệt. Tài khoản không tự khai các mục này.");
  }
}

function readKey(body: Record<string, unknown>): string {
  if (typeof body.idempotencyKey !== "string") throw new HttpError(400, "invalid_request", "Thiếu mã idempotency hợp lệ.");
  return body.idempotencyKey;
}
