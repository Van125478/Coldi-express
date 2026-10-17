import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { appendMessage, listShipperConversations, readAfter, readMessages } from "../chat/conversations.js";
import { readMessageBody } from "../chat/messageInput.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";

export const shipmentChatRouter = Router();

shipmentChatRouter.use(requireAuth, requireRole("SHIPPER"));

shipmentChatRouter.get("/:id/conversations", async (request, response, next) => {
  try {
    const shipperId = request.authUser?.id;
    if (!shipperId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const conversations = await listShipperConversations(routeId(request.params.id, "Không tìm thấy đơn này."), shipperId);
    response.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
});

shipmentChatRouter.get("/:id/conversations/:conversationId/messages", async (request, response, next) => {
  try {
    const shipperId = request.authUser?.id;
    if (!shipperId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const page = await readMessages({
      conversationId: routeId(request.params.conversationId, "Không tìm thấy cuộc trao đổi này."),
      shipmentId: routeId(request.params.id, "Không tìm thấy đơn này."),
      shipperId,
      after: readAfter(request.query.after),
    });
    response.status(200).json(page);
  } catch (error) {
    next(error);
  }
});

shipmentChatRouter.post("/:id/conversations/:conversationId/messages", requireTrustedOrigin, async (request, response, next) => {
  try {
    const shipperId = request.authUser?.id;
    if (!shipperId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const message = await appendMessage({
      conversationId: routeId(request.params.conversationId, "Không tìm thấy cuộc trao đổi này."),
      shipmentId: routeId(request.params.id, "Không tìm thấy đơn này."),
      shipperId,
      senderId: shipperId,
      senderRole: "SHIPPER",
      body: readMessageBody(request.body),
    });
    response.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

function routeId(value: string | string[] | undefined, message: string): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id || !isValidObjectId(id)) throw new HttpError(404, "not_found", message);
  return id;
}
