import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { incidentKey, incidentLimits, incidentListPath } from "@/features/incidents/incidentCopy";
import { timelineStatusText } from "@/features/incidents/incidentPresentation";
import { Field, formatWhen, IncidentBadges } from "@/features/incidents/incidentUi";
import { lostSession } from "@/features/workspace/sessionLoss";
import { DetailBlock, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { BusinessRole } from "@/models/session";
import { ApiError } from "@/services/apiClient";
import { fetchIncidentEvidenceUrl } from "@/services/incidentEvidenceClient";
import {
  acknowledgeIncident,
  closeIncident,
  commentIncident,
  decideIncidentReopen,
  getIncident,
  objectIncident,
  requestIncidentReopen,
  resolveIncident,
  respondIncidentReopen,
  startIncident,
  type IncidentEventRecord,
  type IncidentRecord,
} from "@/services/incidentService";
import { AuthenticatedImageGallery } from "@/shared/components/media/AuthenticatedImageGallery";

type Pending = "acknowledge" | "start" | "resolve" | "object" | "close" | "reopen" | "reopen-approve" | "reopen-reject" | "admin-approve" | "admin-reject" | null;

const noteLimits: Record<Exclude<Pending, "acknowledge" | null>, { min: number; max: number; optional?: boolean }> = {
  start: { min: incidentLimits.noteMin, max: incidentLimits.noteMax },
  resolve: { min: incidentLimits.resolutionMin, max: incidentLimits.resolutionMax },
  object: { min: incidentLimits.objectionMin, max: incidentLimits.objectionMax },
  close: { min: incidentLimits.closeReasonMin, max: incidentLimits.closeReasonMax },
  reopen: { min: incidentLimits.reopenReasonMin, max: incidentLimits.reopenReasonMax },
  "reopen-approve": { min: 1, max: incidentLimits.reopenReasonMax, optional: true },
  "reopen-reject": { min: incidentLimits.reopenReasonMin, max: incidentLimits.reopenReasonMax },
  "admin-approve": { min: incidentLimits.reopenReasonMin, max: incidentLimits.reopenReasonMax },
  "admin-reject": { min: incidentLimits.reopenReasonMin, max: incidentLimits.reopenReasonMax },
};

export function IncidentDetailPage() {
  usePageTitle("Chi tiết sự cố");
  const { id } = useParams();
  const { snapshot, logout } = useAuth();
  const role: BusinessRole = snapshot.status === "authenticated" ? snapshot.user.role : "SHIPPER";
  const viewerId = snapshot.status === "authenticated" ? snapshot.user.id : "";
  const [incident, setIncident] = useState<IncidentRecord | null>(null);
  const [events, setEvents] = useState<IncidentEventRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setState("loading");
    getIncident(id)
      .then((body) => {
        if (!active) return;
        setIncident(body.incident);
        setEvents(body.events);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState(error instanceof ApiError && (error.status === 404 || error.status === 403) ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [id, logout, reloadKey]);

  async function apply(updated: { incident: IncidentRecord }) {
    const refreshed = await getIncident(updated.incident.id);
    setIncident(refreshed.incident);
    setEvents(refreshed.events);
    setPending(null);
    setNote("");
    setNotice("Đã ghi nhận thao tác.");
  }

  async function run(action: Exclude<Pending, null>, text: string) {
    if (!incident || busy) return;
    const limits = action === "acknowledge" ? null : noteLimits[action];
    const trimmed = text.trim();
    if (limits && !limits.optional && (trimmed.length < limits.min || trimmed.length > limits.max)) {
      setFieldError(`Nội dung cần từ ${limits.min} đến ${limits.max} ký tự.`);
      document.getElementById("incident-action-note")?.focus();
      return;
    }
    if (limits?.optional && trimmed.length > 0 && (trimmed.length < limits.min || trimmed.length > limits.max)) {
      setFieldError(`Nội dung cần từ ${limits.min} đến ${limits.max} ký tự.`);
      document.getElementById("incident-action-note")?.focus();
      return;
    }
    setBusy(true);
    setFieldError("");
    setNotice("");
    const key = incidentKey(action);
    try {
      const body =
        action === "acknowledge"
          ? await acknowledgeIncident(incident.id, incident.version, key)
          : action === "start"
            ? await startIncident(incident.id, incident.version, key, trimmed)
            : action === "resolve"
              ? await resolveIncident(incident.id, incident.version, key, trimmed)
              : action === "object"
                ? await objectIncident(incident.id, incident.version, key, trimmed)
                : action === "close"
                  ? await closeIncident(incident.id, incident.version, key, trimmed)
                  : action === "reopen"
                    ? await requestIncidentReopen(incident.id, incident.version, key, trimmed)
                    : action === "reopen-approve" || action === "reopen-reject"
                      ? await respondIncidentReopen(incident.id, incident.version, key, action === "reopen-approve" ? "APPROVE" : "REJECT", trimmed || undefined)
                      : await decideIncidentReopen(incident.id, incident.version, key, action === "admin-approve" ? "APPROVE" : "REJECT", trimmed);
      await apply(body);
    } catch (error: unknown) {
      if (lostSession(error, logout)) return;
      setNotice(error instanceof ApiError ? error.message : "Không thực hiện được thao tác.");
      if (error instanceof ApiError && error.status === 409) setReloadKey((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  async function sendComment() {
    if (!incident || busy) return;
    const text = comment.trim();
    if (text.length < incidentLimits.commentMin || text.length > incidentLimits.commentMax) {
      setFieldError(`Nội dung cần từ ${incidentLimits.commentMin} đến ${incidentLimits.commentMax} ký tự.`);
      document.getElementById("incident-comment")?.focus();
      return;
    }
    setBusy(true);
    setFieldError("");
    try {
      const updated = await commentIncident(incident.id, incident.version, incidentKey("comment"), text);
      const refreshed = await getIncident(updated.incident.id);
      setIncident(refreshed.incident);
      setEvents(refreshed.events);
      setComment("");
      setNotice("Đã gửi cập nhật.");
    } catch (error: unknown) {
      if (lostSession(error, logout)) return;
      setNotice(error instanceof ApiError ? error.message : "Không gửi được cập nhật.");
    } finally {
      setBusy(false);
    }
  }

  const handling =
    Boolean(incident?.capabilities.acknowledge) ||
    Boolean(incident?.capabilities.start) ||
    Boolean(incident?.capabilities.resolve) ||
    Boolean(incident?.capabilities.object) ||
    Boolean(incident?.capabilities.close) ||
    Boolean(incident?.capabilities.requestReopen) ||
    Boolean(incident?.capabilities.respondReopen) ||
    Boolean(incident?.capabilities.adjudicateReopen);

  return (
    <section className="space-y-6">
      <Link to={incidentListPath(role)} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Danh sách sự cố
      </Link>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải sự cố.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy sự cố này trong phạm vi tài khoản của bạn.</p> : null}
      {state === "error" ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-ink">Không tải được sự cố.</p>
          <Button type="button" className="mt-3" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      ) : null}
      {state === "ready" && incident ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <PageHeader title={incident.title} summary={incident.shipmentLabel} />
            <IncidentBadges status={incident.status} statusLabel={incident.statusLabel} categoryLabel={incident.incidentTypeLabel} />
          </div>
          {notice ? (
            <p role="status" className="text-sm text-ink">
              {notice}
            </p>
          ) : null}
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.72fr)]">
            <div className="space-y-4">
              <DetailBlock title="Nội dung báo cáo">
                <dl>
                  <IncidentFact term="Loại sự cố" value={incident.incidentTypeLabel} />
                  <IncidentFact term="Người báo" value={incident.reporterRoleLabel} />
                  <IncidentFact term="Chuyến hàng" value={incident.shipmentLabel} />
                  <IncidentFact term="Báo lúc" value={formatWhen(incident.reportedAt)} />
                  <IncidentFact term="Xảy ra lúc" value={formatWhen(incident.occurredAt)} />
                </dl>
                <p className="whitespace-pre-wrap text-base leading-7 text-ink">{incident.description}</p>
                <AuthenticatedImageGallery
                  images={incident.attachments}
                  fetchUrl={fetchIncidentEvidenceUrl}
                  label="Ảnh chứng cứ"
                  altPrefix="Ảnh chứng cứ"
                  emptyText="Không có ảnh chứng cứ."
                />
              </DetailBlock>
              {incident.resolutionSummary ? (
                <DetailBlock title="Kết quả xử lý">
                  <p className="whitespace-pre-wrap text-base leading-7 text-ink">{incident.resolutionSummary}</p>
                  <dl>
                    <IncidentFact term="Gửi lúc" value={formatWhen(incident.resolvedAt)} />
                  </dl>
                </DetailBlock>
              ) : null}
              {incident.closeReason ? (
                <DetailBlock title="Đóng sự cố">
                  <p className="whitespace-pre-wrap text-base leading-7 text-ink">{incident.closeReason}</p>
                  <dl>
                    <IncidentFact term="Đóng lúc" value={formatWhen(incident.closedAt)} />
                  </dl>
                </DetailBlock>
              ) : null}
              {incident.objectionReason ? (
                <DetailBlock title="Phản đối kết quả">
                  <p className="whitespace-pre-wrap text-base leading-7 text-ink">{incident.objectionReason}</p>
                  <p className="text-sm leading-relaxed text-muted">Kết quả trước đó vẫn nằm trong dòng thời gian.</p>
                </DetailBlock>
              ) : null}
              {incident.reopen.status !== "NONE" ? (
                <DetailBlock title="Yêu cầu mở lại">
                  <dl>
                    <IncidentFact term="Trạng thái yêu cầu" value={incident.reopen.statusLabel} />
                    <IncidentFact term="Lý do" value={incident.reopen.reason ?? "Chưa có"} />
                    <IncidentFact term="Gửi lúc" value={formatWhen(incident.reopen.requestedAt)} />
                    <IncidentFact term="Hạn nhà xe" value={formatWhen(incident.reopen.carrierDeadlineAt)} />
                    <IncidentFact term="Nhà xe phản hồi" value={formatWhen(incident.reopen.carrierRespondedAt)} />
                    <IncidentFact term="Ghi chú nhà xe" value={incident.reopen.carrierNote ?? "Chưa có"} />
                    <IncidentFact term="Chuyển quản trị" value={formatWhen(incident.reopen.escalatedAt)} />
                    <IncidentFact term="Lý do chuyển" value={incident.reopen.escalationCauseLabel ?? "Chưa có"} />
                    <IncidentFact term="Phân công quản trị" value={incident.reopen.adminAssigned ? "Đã có quản trị được phân công" : "Chưa có quản trị được phân công"} />
                    <IncidentFact term="Quyết định quản trị" value={formatWhen(incident.reopen.adminDecidedAt)} />
                    <IncidentFact term="Lý do quản trị" value={incident.reopen.adminReason ?? "Chưa có"} />
                  </dl>
                </DetailBlock>
              ) : null}
              <DetailBlock title="Dòng thời gian">
                {events.length === 0 ? <p className="text-sm text-muted">Chưa có mốc xử lý.</p> : null}
                <ol className="space-y-6">
                  {events.map((event) => (
                    <li key={event.id} className="border-l-2 border-navy/30 py-1 pl-4">
                      <p className="text-base font-bold text-ink">{event.actionLabel}</p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">{timelineStatusText(event)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {event.actorId === viewerId ? "Bạn" : event.actorRoleLabel}
                        <span aria-hidden="true"> · </span>
                        <time dateTime={event.occurredAt}>{formatWhen(event.occurredAt)}</time>
                      </p>
                      {event.note ? <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-ink">{event.note}</p> : null}
                    </li>
                  ))}
                </ol>
              </DetailBlock>
              {incident.capabilities.comment ? (
                <DetailBlock title="Cập nhật">
                  <Field id="incident-comment" label="Nội dung" error={pending ? undefined : fieldError}>
                    <textarea
                      id="incident-comment"
                      value={comment}
                      onChange={(event) => {
                        setComment(event.target.value);
                        setFieldError("");
                      }}
                      rows={4}
                      className="w-full rounded-xl border border-line bg-canvas px-3 py-3 text-sm text-ink"
                    />
                  </Field>
                  <Button type="button" disabled={busy} onClick={() => void sendComment()}>
                    Gửi cập nhật
                  </Button>
                </DetailBlock>
              ) : null}
            </div>
            <div className="space-y-4">
              <DetailBlock title="Xử lý">
                <p className="text-sm leading-relaxed text-muted">{incident.evidence.reason}</p>
                {incident.capabilities.acknowledge ? (
                  <Button type="button" variant="outline" onClick={() => setPending("acknowledge")}>
                    Tiếp nhận
                  </Button>
                ) : null}
                {incident.capabilities.start ? (
                  <Button type="button" variant="outline" onClick={() => setPending("start")}>
                    Bắt đầu xử lý
                  </Button>
                ) : null}
                {incident.capabilities.resolve ? (
                  <Button type="button" variant="outline" onClick={() => setPending("resolve")}>
                    Gửi kết quả
                  </Button>
                ) : null}
                {incident.capabilities.object ? (
                  <Button type="button" variant="outline" onClick={() => setPending("object")}>
                    Phản đối kết quả
                  </Button>
                ) : null}
                {incident.capabilities.close ? (
                  <Button type="button" variant="outline" onClick={() => setPending("close")}>
                    Đóng sự cố phương tiện
                  </Button>
                ) : null}
                {incident.capabilities.requestReopen ? (
                  <Button type="button" variant="outline" onClick={() => setPending("reopen")}>
                    Yêu cầu mở lại
                  </Button>
                ) : null}
                {incident.capabilities.respondReopen ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setPending("reopen-approve")}>
                      Đồng ý mở lại
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setPending("reopen-reject")}>
                      Từ chối mở lại
                    </Button>
                  </>
                ) : null}
                {incident.capabilities.adjudicateReopen ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setPending("admin-approve")}>
                      Quản trị đồng ý mở lại
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setPending("admin-reject")}>
                      Quản trị từ chối mở lại
                    </Button>
                  </>
                ) : null}
                {!handling ? <p className="text-sm text-muted">Không có thao tác xử lý cho vai trò của bạn ở trạng thái này.</p> : null}
                {pending ? (
                  <div className="rounded-xl border border-line bg-canvas p-3">
                    <p className="text-sm font-semibold text-ink">{pendingLabel(pending)}</p>
                    {pending !== "acknowledge" ? (
                      <textarea
                        id="incident-action-note"
                        value={note}
                        onChange={(event) => {
                          setNote(event.target.value);
                          setFieldError("");
                        }}
                        rows={4}
                        className={`mt-3 w-full rounded-xl border bg-surface px-3 py-3 text-sm text-ink ${fieldError ? "border-danger" : "border-line"}`}
                      />
                    ) : null}
                    {fieldError ? <p className="mt-2 text-sm text-ink">{fieldError}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" disabled={busy} onClick={() => void run(pending, note)}>
                        Xác nhận
                      </Button>
                      <Button type="button" variant="outline" disabled={busy} onClick={() => { setPending(null); setFieldError(""); }}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : null}
              </DetailBlock>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function pendingLabel(pending: Exclude<Pending, null>): string {
  if (pending === "acknowledge") return "Xác nhận tiếp nhận sự cố này?";
  if (pending === "start") return "Ghi chú khi bắt đầu xử lý";
  if (pending === "resolve") return "Kết quả xử lý";
  if (pending === "object") return "Lý do phản đối";
  if (pending === "close") return "Lý do đóng hoặc mã kết quả xử lý";
  if (pending === "reopen") return "Lý do yêu cầu mở lại";
  if (pending === "reopen-approve") return "Ghi chú khi đồng ý mở lại (không bắt buộc)";
  if (pending === "reopen-reject") return "Lý do từ chối mở lại";
  if (pending === "admin-approve") return "Lý do quản trị đồng ý mở lại";
  return "Lý do quản trị từ chối mở lại";
}

function IncidentFact({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-line py-2 last:border-b-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{term}</dt>
      <dd className="text-base font-semibold leading-relaxed text-ink">{value}</dd>
    </div>
  );
}
