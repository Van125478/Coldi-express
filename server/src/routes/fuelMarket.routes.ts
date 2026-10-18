import { Router } from "express";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { officialDieselSourceUrl, dieselPriceKinds, dieselProduct, type DieselPriceKind } from "../market/diesel/policy.js";
import { readDieselPrice } from "../market/diesel/read.js";
import { DieselPublication } from "../models/dieselPrice.js";
import { readOilPrices, unavailableOilPrices } from "../market/oil/read.js";

export const fuelMarketRouter = Router();

fuelMarketRouter.get("/", async (_request, response) => {
  const diesel = await readDieselPrice();
  try {
    const oil = await readOilPrices(new Date());
    response.set("Cache-Control", "public, max-age=300");
    response.status(200).json({ diesel, oil });
  } catch (error) {
    console.error("Fuel market oil read failed.", error instanceof Error ? error.name : "error");
    response.set("Cache-Control", "no-store");
    response.status(200).json({ diesel, oil: unavailableOilPrices() });
  }
});

fuelMarketRouter.post("/diesel", requireAuth, requireRole("ADMIN"), requireTrustedOrigin, async (request, response, next) => {
  try {
    const body = request.body as Record<string, unknown>;
    if (body.product !== dieselProduct) {
      throw new HttpError(400, "invalid_request", "Chỉ công bố dầu diesel 0.05S.", { product: "Chỉ công bố dầu diesel 0.05S." });
    }
    if (typeof body.priceKind !== "string" || !dieselPriceKinds.includes(body.priceKind as DieselPriceKind)) {
      throw new HttpError(400, "invalid_request", "Chọn giá trần công bố hoặc giá bán lẻ.", { priceKind: "Chọn giá trần công bố hoặc giá bán lẻ." });
    }
    const priceKind = body.priceKind as DieselPriceKind;
    const price = Number(body.priceVndPerLitre);
    if (!Number.isInteger(price) || price < 1 || price > 99_999_999) {
      throw new HttpError(400, "invalid_request", "Giá diesel phải là số nguyên đồng/lít đã xác minh.", { priceVndPerLitre: "Giá diesel phải là số nguyên đồng/lít đã xác minh." });
    }
    const documentNumber = typeof body.documentNumber === "string" ? body.documentNumber.trim() : "";
    if (documentNumber.length < 6 || documentNumber.length > 80) {
      throw new HttpError(400, "invalid_request", "Cần số hiệu văn bản gốc.", { documentNumber: "Cần số hiệu văn bản gốc." });
    }
    const sourceUrl = typeof body.sourceUrl === "string" ? officialDieselSourceUrl(body.sourceUrl) : null;
    if (!sourceUrl) {
      throw new HttpError(400, "invalid_request", "Nguồn phải là địa chỉ https của moit.gov.vn hoặc minhbach.moit.gov.vn.", { sourceUrl: "Nguồn phải là địa chỉ https của moit.gov.vn hoặc minhbach.moit.gov.vn." });
    }
    if (typeof body.announcedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.announcedOn)) {
      throw new HttpError(400, "invalid_request", "Ngày ban hành không hợp lệ.", { announcedOn: "Ngày ban hành không hợp lệ." });
    }
    const effectiveAt = typeof body.effectiveAt === "string" ? new Date(body.effectiveAt) : new Date(NaN);
    if (Number.isNaN(effectiveAt.getTime())) {
      throw new HttpError(400, "invalid_request", "Thời điểm hiệu lực không hợp lệ.", { effectiveAt: "Thời điểm hiệu lực không hợp lệ." });
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
    const actorId = request.authUser?.id;
    if (!actorId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    await DieselPublication.updateMany({ product: dieselProduct, superseded: false }, { $set: { superseded: true } });
    const created = await DieselPublication.create({
      product: dieselProduct,
      priceKind,
      priceVndPerLitre: price,
      documentNumber,
      sourceUrl,
      announcedOn: body.announcedOn,
      effectiveAt,
      verifiedAt: new Date(),
      verifiedBy: actorId,
      note,
      superseded: false,
    });
    response.status(201).json({ diesel: await readDieselPrice(), id: created._id.toString() });
  } catch (error) {
    next(error);
  }
});
