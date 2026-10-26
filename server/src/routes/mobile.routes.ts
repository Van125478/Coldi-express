import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireOperationalSession } from "../middlewares/requireOperational.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";
import { ShipmentFavorite } from "../models/shipmentFavorite.js";
import { ShipmentReview } from "../models/shipmentReview.js";
import { Shipment } from "../models/shipment.js";
import type { UserRole } from "../models/user.js";
import { canReadMobileShipment, canReadReviews } from "../mobile/access.js";
import { carrierBoardFilter, compareMobileShipments, readMobileCatalogQuery, shipperCatalogFilter } from "../mobile/catalogQuery.js";
import { readFavoriteShipmentId, readReviewInput } from "../mobile/reviewInput.js";
import { groupReviews, toMobileReview, toMobileShipmentCard } from "../mobile/present.js";

export const mobileRouter = Router();

mobileRouter.use(requireAuth, requireOperationalSession, requireRole("SHIPPER", "CARRIER"));

function requireUser(request: { authUser?: { id: string; role: UserRole } }): { id: string; role: UserRole } {
  const user = request.authUser;
  if (!user) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
  return user;
}

function duplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}

async function readableShipment(role: UserRole, userId: string, id: string) {
  if (!isValidObjectId(id)) throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  const shipment = await Shipment.findById(id);
  if (!shipment || !canReadMobileShipment(role, userId, shipment)) {
    throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  }
  return shipment;
}

mobileRouter.get("/shipments", async (request, response, next) => {
  try {
    const user = requireUser(request);
    const parsed = readMobileCatalogQuery(request.query as Record<string, unknown>);
    const filter = user.role === "CARRIER" ? carrierBoardFilter(parsed) : shipperCatalogFilter(user.id, parsed);
    const total = await Shipment.countDocuments(filter);
    const matched = await Shipment.find(filter).limit(500);
    matched.sort(compareMobileShipments(parsed.sort));
    const page = matched.slice(0, 100);
    response.status(200).json({
      shipments: page.map((shipment) => toMobileShipmentCard(shipment)),
      total,
      shown: page.length,
      truncated: total > matched.length,
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.get("/shipments/:id/reviews", async (request, response, next) => {
  try {
    const user = requireUser(request);
    const id = request.params.id;
    if (typeof id !== "string") throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
    const shipment = await readableShipment(user.role, user.id, id);
    const reviews = await ShipmentReview.find({ shipmentId: shipment._id }).sort({ createdAt: -1, _id: -1 });
    response.status(200).json({
      reviews: reviews.map((review) => toMobileReview(review)),
      total: reviews.length,
      groups: groupReviews(reviews),
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.post("/shipments/:id/reviews", requireTrustedOrigin, async (request, response, next) => {
  try {
    const user = requireUser(request);
    if (user.role !== "SHIPPER") {
      throw new HttpError(403, "forbidden", "Chỉ chủ hàng của chuyến đã giao mới ghi được đánh giá.");
    }
    const id = request.params.id;
    if (typeof id !== "string") throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
    const shipment = await readableShipment(user.role, user.id, id);
    if (shipment.status !== "DELIVERY_CONFIRMED" || shipment.carrierId == null) {
      throw new HttpError(409, "review_not_open", "Chỉ đánh giá được sau khi chuyến đã xác nhận giao và đã có nhà xe.");
    }
    const input = readReviewInput(request.body);
    try {
      const review = await ShipmentReview.create({
        shipmentId: shipment._id,
        shipperId: user.id,
        carrierId: shipment.carrierId,
        stars: input.stars,
        comment: input.comment,
      });
      response.status(201).json({ review: toMobileReview(review) });
    } catch (error) {
      if (duplicateKey(error)) throw new HttpError(409, "review_exists", "Chuyến này đã có đánh giá.");
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

mobileRouter.get("/shipments/:id", async (request, response, next) => {
  try {
    const user = requireUser(request);
    const id = request.params.id;
    if (typeof id !== "string") throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
    const shipment = await readableShipment(user.role, user.id, id);
    const reviews = canReadReviews(user.role, user.id, shipment)
      ? await ShipmentReview.find({ shipmentId: shipment._id })
      : [];
    response.status(200).json({
      shipment: toMobileShipmentCard(shipment),
      reviewSummary: { total: reviews.length, groups: groupReviews(reviews) },
    });
  } catch (error) {
    next(error);
  }
});

mobileRouter.get("/favorites", async (request, response, next) => {
  try {
    const user = requireUser(request);
    const saved = await ShipmentFavorite.find({ userId: user.id }).sort({ createdAt: -1, _id: -1 });
    const shipments = await Shipment.find({ _id: { $in: saved.map((item) => item.shipmentId) } });
    const byId = new Map(shipments.map((shipment) => [shipment._id.toString(), shipment]));
    const visible = saved.flatMap((item) => {
      const shipment = byId.get(item.shipmentId.toString());
      if (!shipment || !canReadMobileShipment(user.role, user.id, shipment)) return [];
      return [toMobileShipmentCard(shipment)];
    });
    response.status(200).json({ shipments: visible });
  } catch (error) {
    next(error);
  }
});

mobileRouter.post("/favorites", requireTrustedOrigin, async (request, response, next) => {
  try {
    const user = requireUser(request);
    const shipmentId = readFavoriteShipmentId(request.body);
    const shipment = await readableShipment(user.role, user.id, shipmentId);
    try {
      await ShipmentFavorite.create({ userId: user.id, shipmentId: shipment._id });
    } catch (error) {
      if (duplicateKey(error)) throw new HttpError(409, "favorite_exists", "Chuyến này đã nằm trong danh sách quan tâm.");
      throw error;
    }
    response.status(201).json({ shipment: toMobileShipmentCard(shipment) });
  } catch (error) {
    next(error);
  }
});

mobileRouter.delete("/favorites", requireTrustedOrigin, async (request, response, next) => {
  try {
    const user = requireUser(request);
    const result = await ShipmentFavorite.deleteMany({ userId: user.id });
    response.status(200).json({ removed: result.deletedCount });
  } catch (error) {
    next(error);
  }
});

mobileRouter.delete("/favorites/:shipmentId", requireTrustedOrigin, async (request, response, next) => {
  try {
    const user = requireUser(request);
    const shipmentId = request.params.shipmentId;
    if (typeof shipmentId !== "string" || !isValidObjectId(shipmentId)) {
      throw new HttpError(404, "not_found", "Không tìm thấy chuyến này trong danh sách quan tâm.");
    }
    const removed = await ShipmentFavorite.findOneAndDelete({ userId: user.id, shipmentId });
    if (!removed) throw new HttpError(404, "not_found", "Không tìm thấy chuyến này trong danh sách quan tâm.");
    response.status(200).json({ removed: true });
  } catch (error) {
    next(error);
  }
});
