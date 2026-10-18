import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { commissionBanner, ledgerFor, presentEntry } from "../commission/present.js";
import { rememberEstimated, type SideSnapshot } from "../commission/record.js";
import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireOperationalSession } from "../middlewares/requireOperational.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { Shipment } from "../models/shipment.js";

export const commissionRouter = Router();

const idempotencyPattern = /^[A-Za-z0-9._:-]{8,80}$/;

commissionRouter.use(requireAuth, requireOperationalSession);

commissionRouter.get("/mine", async (request, response, next) => {
  try {
    const user = request.authUser;
    if (!user) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    if (user.role !== "SHIPPER" && user.role !== "CARRIER") {
      throw new HttpError(403, "forbidden", "Tài khoản này không có quyền xem hoa hồng.");
    }
    const side = user.role === "SHIPPER" ? "shipper" : "carrier";
    const payerSide = user.role === "SHIPPER" ? "SHIPPER" : "CARRIER";
    const shipments = await Shipment.find(
      user.role === "SHIPPER"
        ? { shipperId: user.id, "commission.shipper.payerAccountId": user.id }
        : { carrierId: user.id, "commission.carrier.payerAccountId": user.id },
    ).sort({ updatedAt: -1 });
    const entries = [];
    for (const shipment of shipments) {
      const ledger = await ledgerFor(shipment._id.toString(), user.id, payerSide);
      const entry = presentEntry(shipment._id.toString(), shipment.commission, side, [], ledger.recordedAt);
      entries.push({ ...entry, ledger: [] });
    }
    response.status(200).json({
      available: getEnv().commissionSimulationAllowed,
      simulation: getEnv().commissionSimulationAllowed,
      paymentCollected: false,
      banner: commissionBanner,
      entries,
    });
  } catch (error) {
    next(error);
  }
});

commissionRouter.get("/shipments/:id", async (request, response, next) => {
  try {
    const loaded = await loadOwn(request.authUser, request.params.id);
    const snapshot = loaded.shipment.commission?.[loaded.side];
    if (snapshot) {
      await rememberEstimated(loaded.shipment._id.toString(), snapshot as SideSnapshot);
    }
    const ledger = await ledgerFor(loaded.shipment._id.toString(), loaded.userId, loaded.payerSide);
    response.status(200).json({
      available: getEnv().commissionSimulationAllowed,
      simulation: snapshot?.simulation === true,
      paymentCollected: false,
      banner: commissionBanner,
      shipment: presentEntry(loaded.shipment._id.toString(), loaded.shipment.commission, loaded.side, ledger.rows, ledger.recordedAt),
    });
  } catch (error) {
    next(error);
  }
});

commissionRouter.post("/holds", requireTrustedOrigin, denyMutation);
commissionRouter.post("/releases", requireTrustedOrigin, denyMutation);
commissionRouter.post("/adjustments", requireTrustedOrigin, denyMutation);

function denyMutation(request: { get(name: string): string | undefined }, _response: unknown, next: (error?: unknown) => void) {
  const key = request.get("idempotency-key");
  if (!key || !idempotencyPattern.test(key)) {
    next(new HttpError(400, "invalid_request", "Thiếu mã idempotency hợp lệ."));
    return;
  }
  next(new HttpError(403, "commission_mutation_denied", "Quyền tạm giữ, mở giữ và điều chỉnh hoa hồng chưa được phê duyệt."));
}

async function loadOwn(user: { id: string; role: string } | null | undefined, rawId: string | string[] | undefined) {
  if (!user) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
  if (user.role !== "SHIPPER" && user.role !== "CARRIER") {
    throw new HttpError(403, "forbidden", "Tài khoản này không có quyền xem hoa hồng.");
  }
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id || !isValidObjectId(id)) throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  const shipment = await Shipment.findById(id);
  if (!shipment) throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  if (user.role === "SHIPPER") {
    if (shipment.shipperId.toString() !== user.id) throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
    return { shipment, side: "shipper" as const, payerSide: "SHIPPER" as const, userId: user.id };
  }
  if (shipment.carrierId?.toString() !== user.id) throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  return { shipment, side: "carrier" as const, payerSide: "CARRIER" as const, userId: user.id };
}
