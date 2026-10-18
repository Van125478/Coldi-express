import { Router } from "express";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireOperationalSession } from "../middlewares/requireOperational.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import type { Actor } from "../incidents/access.js";
import {
  acknowledgeIncident,
  addIncidentComment,
  adminDecideReopen,
  carrierRespondReopen,
  closeIncident,
  correlationFrom,
  requestIncidentReopen,
  createIncident,
  getAuthorizedIncident,
  listAuthorizedIncidents,
  listNotifications,
  markNotificationRead,
  objectToResolution,
  resolveIncident,
  startInvestigation,
  unreadNotificationCount,
} from "../incidents/service.js";
import { incidentLimits, readIncidentDraft, readLimit, readNote, readVersion } from "../incidents/policy.js";

export const incidentRouter = Router();

incidentRouter.use(requireAuth, requireOperationalSession);

incidentRouter.get("/notifications/unread-count", async (request, response, next) => {
  try {
    response.status(200).json({ unread: await unreadNotificationCount(actor(request.authUser)) });
  } catch (error) {
    next(error);
  }
});

incidentRouter.get("/notifications", async (request, response, next) => {
  try {
    const notifications = await listNotifications(actor(request.authUser), readLimit(request.query.limit));
    response.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/notifications/:id/read", requireTrustedOrigin, async (request, response, next) => {
  try {
    const notification = await markNotificationRead(actor(request.authUser), routeId(request.params.id));
    response.status(200).json({ notification });
  } catch (error) {
    next(error);
  }
});

incidentRouter.get("/", async (request, response, next) => {
  try {
    const shipmentId = typeof request.query.shipmentId === "string" ? request.query.shipmentId : undefined;
    const status = typeof request.query.status === "string" ? request.query.status : undefined;
    const cursor = typeof request.query.cursor === "string" ? request.query.cursor : undefined;
    const page = await listAuthorizedIncidents(actor(request.authUser), {
      limit: readLimit(request.query.limit),
      cursor,
      shipmentId,
      status,
    });
    response.status(200).json(page);
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/", requireTrustedOrigin, async (request, response, next) => {
  try {
    const draft = readIncidentDraft(request.body, request.headers["idempotency-key"]);
    if (!draft.ok) throw new HttpError(400, draft.code, draft.message, draft.fields);
    const result = await createIncident(actor(request.authUser), draft.draft, correlationFrom(request.headers["x-request-id"]));
    response.status(result.created ? 201 : 200).json({ incident: result.incident });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/close", requireTrustedOrigin, async (request, response, next) => {
  try {
    const result = await closeIncident({
      actor: actor(request.authUser),
      incidentId: routeId(request.params.id),
      expectedVersion: versionOf(request.body),
      idempotencyKey: keyOf(request),
      correlationId: correlationFrom(request.headers["x-request-id"]),
      note: bodyRecord(request.body).closeReason,
    });
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/reopen-request", requireTrustedOrigin, async (request, response, next) => {
  try {
    const result = await requestIncidentReopen({
      actor: actor(request.authUser),
      incidentId: routeId(request.params.id),
      expectedVersion: versionOf(request.body),
      idempotencyKey: keyOf(request),
      correlationId: correlationFrom(request.headers["x-request-id"]),
      note: bodyRecord(request.body).reason,
    });
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/reopen-response", requireTrustedOrigin, async (request, response, next) => {
  try {
    const body = bodyRecord(request.body);
    const result = await carrierRespondReopen({
      actor: actor(request.authUser),
      incidentId: routeId(request.params.id),
      expectedVersion: versionOf(request.body),
      idempotencyKey: keyOf(request),
      correlationId: correlationFrom(request.headers["x-request-id"]),
      approve: decisionOf(body.decision),
      note: body.note,
    });
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/reopen-decision", requireTrustedOrigin, async (request, response, next) => {
  try {
    const body = bodyRecord(request.body);
    const result = await adminDecideReopen({
      actor: actor(request.authUser),
      incidentId: routeId(request.params.id),
      expectedVersion: versionOf(request.body),
      idempotencyKey: keyOf(request),
      correlationId: correlationFrom(request.headers["x-request-id"]),
      approve: decisionOf(body.decision),
      note: body.reason,
    });
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/escalate", requireTrustedOrigin, (_request, _response, next) => {
  next(new HttpError(403, "incident_escalation_denied", "Luân chuyển và phân công quản trị còn mở. Thao tác này chưa được phép."));
});

incidentRouter.post("/:id/priority", requireTrustedOrigin, (_request, _response, next) => {
  next(new HttpError(403, "incident_priority_denied", "Ngưỡng ưu tiên chưa được duyệt. Thao tác này chưa được phép."));
});

incidentRouter.get("/:id/events", async (request, response, next) => {
  try {
    const result = await getAuthorizedIncident(actor(request.authUser), routeId(request.params.id));
    response.status(200).json({ events: result.events });
  } catch (error) {
    next(error);
  }
});

incidentRouter.get("/:id", async (request, response, next) => {
  try {
    response.status(200).json(await getAuthorizedIncident(actor(request.authUser), routeId(request.params.id)));
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/comments", requireTrustedOrigin, async (request, response, next) => {
  try {
    const note = requiredNote(request.body, "body", incidentLimits.commentMin, incidentLimits.commentMax, "Nội dung cập nhật");
    const result = await addIncidentComment(actor(request.authUser), routeId(request.params.id), versionOf(request.body), keyOf(request), correlationFrom(request.headers["x-request-id"]), note);
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/acknowledge", requireTrustedOrigin, async (request, response, next) => {
  try {
    const result = await acknowledgeIncident(actor(request.authUser), routeId(request.params.id), versionOf(request.body), keyOf(request), correlationFrom(request.headers["x-request-id"]));
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/start", requireTrustedOrigin, async (request, response, next) => {
  try {
    const note = requiredNote(request.body, "note", incidentLimits.noteMin, incidentLimits.noteMax, "Ghi chú xử lý");
    const result = await startInvestigation(actor(request.authUser), routeId(request.params.id), versionOf(request.body), keyOf(request), correlationFrom(request.headers["x-request-id"]), note);
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/resolve", requireTrustedOrigin, async (request, response, next) => {
  try {
    const note = requiredNote(request.body, "resolutionSummary", incidentLimits.resolutionMin, incidentLimits.resolutionMax, "Kết quả xử lý");
    const result = await resolveIncident(actor(request.authUser), routeId(request.params.id), versionOf(request.body), keyOf(request), correlationFrom(request.headers["x-request-id"]), note);
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

incidentRouter.post("/:id/object", requireTrustedOrigin, async (request, response, next) => {
  try {
    const note = requiredNote(request.body, "objectionReason", incidentLimits.objectionMin, incidentLimits.objectionMax, "Lý do phản đối");
    const result = await objectToResolution(actor(request.authUser), routeId(request.params.id), versionOf(request.body), keyOf(request), correlationFrom(request.headers["x-request-id"]), note);
    response.status(200).json({ incident: result });
  } catch (error) {
    next(error);
  }
});

function actor(user: Express.Request["authUser"]): Actor {
  if (!user) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
  return { id: user.id, role: user.role };
}

function routeId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  return id;
}

function bodyRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Yêu cầu không hợp lệ.");
  }
  return body as Record<string, unknown>;
}

function versionOf(body: unknown): number {
  const version = readVersion(bodyRecord(body).expectedVersion);
  if (!version.ok) throw new HttpError(400, "invalid_request", version.message, { expectedVersion: version.message });
  return version.value;
}

function keyOf(request: { body: unknown; headers: { [key: string]: unknown } }): string {
  const record = bodyRecord(request.body);
  const header = request.headers["idempotency-key"];
  const headerValue = Array.isArray(header) ? header[0] : header;
  if (typeof record.idempotencyKey === "string" && typeof headerValue === "string" && record.idempotencyKey !== headerValue) {
    throw new HttpError(400, "invalid_request", "Mã idempotency không khớp.", { idempotencyKey: "Mã idempotency không khớp." });
  }
  const value = typeof headerValue === "string" ? headerValue : record.idempotencyKey;
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]{8,80}$/.test(value)) {
    throw new HttpError(400, "invalid_request", "Thiếu mã idempotency hợp lệ.", { idempotencyKey: "Thiếu mã idempotency hợp lệ." });
  }
  return value;
}

function decisionOf(value: unknown): boolean {
  if (value === "APPROVE") return true;
  if (value === "REJECT") return false;
  throw new HttpError(400, "invalid_request", "Hãy chọn đồng ý hoặc từ chối.", { decision: "Hãy chọn đồng ý hoặc từ chối." });
}

function requiredNote(body: unknown, field: string, min: number, max: number, label: string): string {
  const note = readNote(bodyRecord(body)[field], min, max, label);
  if (!note.ok) throw new HttpError(400, "invalid_request", note.message, { [field]: note.message });
  return note.value;
}
