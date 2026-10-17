import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { readAfter, appendMessage, openCarrierConversation, readMessages } from "../chat/conversations.js";
import { readEmptyBody, readMessageBody } from "../chat/messageInput.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";

export const carrierConversationRouter = Router();

carrierConversationRouter.use(requireAuth, requireRole("CARRIER"));

carrierConversationRouter.post("/by-shipment/:shipmentId", requireTrustedOrigin, async (request, response, next) => {
  try {
    readEmptyBody(request.body);
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const shipmentId = routeId(request.params.shipmentId);
    response.status(200).json({ conversation: await openCarrierConversation(shipmentId, carrierId) });
  } catch (error) {
    next(error);
  }
});

carrierConversationRouter.get("/:conversationId/messages", async (request, response, next) => {
  try {
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const page = await readMessages({
      conversationId: routeId(request.params.conversationId),
      carrierId,
      after: readAfter(request.query.after),
    });
    response.status(200).json(page);
  } catch (error) {
    next(error);
  }
});

carrierConversationRouter.post("/:conversationId/messages", requireTrustedOrigin, async (request, response, next) => {
  try {
    const carrierId = request.authUser?.id;
    if (!carrierId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const message = await appendMessage({
      conversationId: routeId(request.params.conversationId),
      carrierId,
      senderId: carrierId,
      senderRole: "CARRIER",
      body: readMessageBody(request.body),
    });
    response.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

function routeId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id || !isValidObjectId(id)) throw new HttpError(404, "not_found", "Không tìm thấy cuộc trao đổi này.");
  return id;
}
