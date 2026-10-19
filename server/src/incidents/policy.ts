export const incidentTypes = [
  "TEMPERATURE_ISSUE",
  "VEHICLE_ISSUE",
  "DELAY",
  "CARGO_ISSUE",
  "PICKUP_DELIVERY_ISSUE",
  "OTHER",
] as const;

export type IncidentType = (typeof incidentTypes)[number];

export const incidentTypeLabels: Record<IncidentType, string> = {
  TEMPERATURE_ISSUE: "Sự cố nhiệt độ",
  VEHICLE_ISSUE: "Sự cố phương tiện",
  DELAY: "Chậm trễ",
  CARGO_ISSUE: "Sự cố hàng hóa",
  PICKUP_DELIVERY_ISSUE: "Sự cố lấy/giao hàng",
  OTHER: "Khác",
};

export const incidentStatuses = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export type IncidentStatus = (typeof incidentStatuses)[number];

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  OPEN: "Chờ tiếp nhận",
  ACKNOWLEDGED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã có kết quả xử lý",
  CLOSED: "Đã đóng",
};

/** Technical proposal only. This is not an approved business enum. */
export const escalationStatuses = ["NONE", "REQUESTED", "ACTIVE", "FINISHED", "DECLINED"] as const;

export type EscalationStatus = (typeof escalationStatuses)[number];

export const incidentActions = [
  "CREATED",
  "ACKNOWLEDGED",
  "INVESTIGATION_STARTED",
  "COMMENT",
  "RESOLVED",
  "OBJECTED",
  "CLOSED",
  "REOPEN_REQUESTED",
  "REOPEN_APPROVED",
  "REOPEN_REJECTED_BY_CARRIER",
  "REOPEN_ESCALATED_TO_ADMIN",
  "ADMIN_REOPEN_APPROVED",
  "ADMIN_REOPEN_REJECTED",
] as const;

export type IncidentAction = (typeof incidentActions)[number];

/** Only VEHICLE_ISSUE has an approved close and reopen policy. Other types keep the close route denied. */
export const closableIncidentTypes: readonly IncidentType[] = ["VEHICLE_ISSUE"];

/**
 * Reopen request state, separate from the primary status.
 * PENDING_CARRIER keeps the incident CLOSED until a carrier or the assigned admin approves.
 */
export const reopenStatuses = [
  "NONE",
  "PENDING_CARRIER",
  "APPROVED_BY_CARRIER",
  "AWAITING_ADMIN",
  "APPROVED_BY_ADMIN",
  "REJECTED_BY_ADMIN",
] as const;

export type ReopenStatus = (typeof reopenStatuses)[number];

export const reopenStatusLabels: Record<ReopenStatus, string> = {
  NONE: "Chưa có yêu cầu mở lại",
  PENDING_CARRIER: "Chờ nhà xe phản hồi yêu cầu mở lại",
  APPROVED_BY_CARRIER: "Nhà xe đã đồng ý mở lại",
  AWAITING_ADMIN: "Đã chuyển quản trị COLDI xem xét",
  APPROVED_BY_ADMIN: "Quản trị COLDI đã đồng ý mở lại",
  REJECTED_BY_ADMIN: "Quản trị COLDI đã từ chối mở lại",
};

export const reopenEscalationCauses = ["CARRIER_REJECTED", "CARRIER_TIMEOUT"] as const;

export type ReopenEscalationCause = (typeof reopenEscalationCauses)[number];

/** Approved: a carrier that does not answer within 48 hours is referred to COLDI Admin. */
export const reopenCarrierWindowMs = 48 * 60 * 60 * 1000;

/** The status an approved reopen returns to. Handling resumes; the previous resolution stays in history. */
export const reopenedIncidentStatus: IncidentStatus = "IN_PROGRESS";

export const reminderKinds = [
  "ACK_PENDING",
  "PROGRESS_PENDING",
  "ESCALATION_PENDING",
  "RESOLUTION_FEEDBACK_PENDING",
] as const;

export type ReminderKind = (typeof reminderKinds)[number];

export const reportableShipmentStatuses = ["PUBLISHED", "MATCHED", "PICKUP_CONFIRMED", "IN_TRANSIT"] as const;

/**
 * Technical input bounds. These are not approved commercial rules.
 * Title and description lengths follow the v2.8 form proposal only as a validator.
 */
export const incidentLimits = {
  titleMin: 5,
  titleMax: 120,
  descriptionMin: 20,
  descriptionMax: 2000,
  commentMin: 1,
  commentMax: 2000,
  noteMin: 1,
  noteMax: 2000,
  resolutionMin: 10,
  resolutionMax: 2000,
  objectionMin: 10,
  objectionMax: 2000,
  closeReasonMin: 10,
  closeReasonMax: 2000,
  reopenReasonMin: 10,
  reopenReasonMax: 2000,
  reopenResponseMax: 2000,
} as const;

export const idempotencyPattern = /^[A-Za-z0-9._:-]{8,80}$/;

export const pageDefault = 20;
export const pageMax = 50;
export const appliedKeyLimit = 80;

const identityFields = ["reporterId", "reporterRole", "carrierId", "adminId", "handlerId", "shipperId"] as const;
const evidenceFields = ["image", "images", "files", "attachments", "attachmentIds"] as const;

export type FieldErrors = Record<string, string>;

export type IncidentDraft = {
  shipmentId: string;
  incidentType: IncidentType;
  title: string;
  description: string;
  occurredAt: Date | null;
  idempotencyKey: string;
  evidenceIds: string[];
};

export type DraftResult = { ok: true; draft: IncidentDraft } | { ok: false; code: string; message: string; fields: FieldErrors };

export function readIncidentDraft(body: unknown, headerKey: unknown, now = new Date()): DraftResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, code: "invalid_request", message: "Yêu cầu không hợp lệ.", fields: {} };
  }
  const record = body as Record<string, unknown>;
  if (identityFields.some((field) => field in record)) {
    return {
      ok: false,
      code: "forged_actor",
      message: "Người báo, vai trò và nhà xe do phiên đăng nhập cùng dữ liệu chuyến xác định.",
      fields: {},
    };
  }
  if (evidenceFields.some((field) => field in record)) {
    return {
      ok: false,
      code: "incident_evidence_blocked",
      message: "Ảnh chứng cứ chưa được mở vì chưa có kho lưu trữ riêng và bước kiểm tra nội dung.",
      fields: {},
    };
  }
  if ("status" in record || "priority" in record || "escalationStatus" in record) {
    return { ok: false, code: "invalid_request", message: "Trạng thái và mức ưu tiên không do người báo tự đặt.", fields: {} };
  }

  const fields: FieldErrors = {};
  const shipmentId = typeof record.shipmentId === "string" ? record.shipmentId.trim() : "";
  if (!/^[a-f0-9]{24}$/i.test(shipmentId)) fields.shipmentId = "Chọn chuyến hàng hợp lệ.";

  const incidentType = record.incidentType;
  if (typeof incidentType !== "string" || !incidentTypes.includes(incidentType as IncidentType)) {
    fields.incidentType = "Chọn một loại sự cố trong danh sách.";
  }

  const title = bounded(record.title, incidentLimits.titleMin, incidentLimits.titleMax);
  if (!title.ok) fields.title = `Tiêu đề cần từ ${incidentLimits.titleMin} đến ${incidentLimits.titleMax} ký tự.`;

  const description = bounded(record.description, incidentLimits.descriptionMin, incidentLimits.descriptionMax);
  if (!description.ok) {
    fields.description = `Mô tả cần từ ${incidentLimits.descriptionMin} đến ${incidentLimits.descriptionMax} ký tự.`;
  }

  const occurred = readOccurredAt(record.occurredAt, now);
  if (!occurred.ok) fields.occurredAt = occurred.message;
  const evidenceIds = readEvidenceIds(record.evidenceIds);
  if (!evidenceIds.ok) fields.evidenceIds = evidenceIds.message;

  const key = readKey(record.idempotencyKey, headerKey);
  if (!key.ok) fields.idempotencyKey = "Thiếu mã idempotency hợp lệ.";

  if (Object.keys(fields).length > 0 || !title.ok || !description.ok || !occurred.ok || !evidenceIds.ok || !key.ok) {
    return { ok: false, code: "invalid_request", message: "Một số thông tin chưa hợp lệ.", fields };
  }

  return {
    ok: true,
    draft: {
      shipmentId,
      incidentType: incidentType as IncidentType,
      title: title.value,
      description: description.value,
      occurredAt: occurred.value,
      evidenceIds: evidenceIds.value,
      idempotencyKey: key.value,
    },
  };
}

export function readNote(value: unknown, min: number, max: number, label: string): { ok: true; value: string } | { ok: false; message: string } {
  const text = bounded(value, min, max);
  if (!text.ok) return { ok: false, message: `${label} cần từ ${min} đến ${max} ký tự.` };
  return text;
}

export function readVersion(value: unknown): { ok: true; value: number } | { ok: false; message: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return { ok: false, message: "Thiếu phiên bản hiện tại của sự cố." };
  }
  return { ok: true, value };
}

export function readLimit(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : pageDefault;
  if (!Number.isInteger(parsed) || parsed < 1) return pageDefault;
  return Math.min(parsed, pageMax);
}

function readKey(bodyKey: unknown, headerKey: unknown): { ok: true; value: string } | { ok: false } {
  const header = Array.isArray(headerKey) ? headerKey[0] : headerKey;
  if (typeof bodyKey === "string" && typeof header === "string" && bodyKey !== header) return { ok: false };
  const value = typeof header === "string" ? header : bodyKey;
  if (typeof value !== "string" || !idempotencyPattern.test(value)) return { ok: false };
  return { ok: true, value };
}

export function readEvidenceIds(value: unknown): { ok: true; value: string[] } | { ok: false; message: string } {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value) || value.length > 5) return { ok: false, message: "Chỉ được đính kèm tối đa 5 ảnh chứng cứ." };
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || !/^[a-f0-9]{24}$/i.test(item) || seen.has(item)) {
      return { ok: false, message: "Danh sách ảnh chứng cứ không hợp lệ." };
    }
    seen.add(item);
    ids.push(item);
  }
  return { ok: true, value: ids };
}

function readOccurredAt(value: unknown, now: Date): { ok: true; value: Date | null } | { ok: false; message: string } {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, message: "Thời điểm xảy ra không hợp lệ." };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { ok: false, message: "Thời điểm xảy ra không hợp lệ." };
  if (parsed.getTime() > now.getTime() + 5 * 60 * 1000) {
    return { ok: false, message: "Thời điểm xảy ra không được nằm ở tương lai." };
  }
  return { ok: true, value: parsed };
}

function bounded(value: unknown, min: number, max: number): { ok: true; value: string } | { ok: false } {
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim().replaceAll("\u0000", "");
  if (trimmed.length < min || trimmed.length > max) return { ok: false };
  return { ok: true, value: trimmed };
}
