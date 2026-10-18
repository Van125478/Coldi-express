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
  commentIncident,
  getIncident,
  objectIncident,
  resolveIncident,
  startIncident,
  type IncidentEventRecord,
  type IncidentRecord,
} from "@/services/incidentService";

type Pending = "acknowledge" | "start" | "resolve" | "object" | null;

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

  async function run(action: Exclude<Pending, null>, text: string) {
    if (!incident || busy) return;
    const limits = action === "start" ? incidentLimits.noteMin : action === "resolve" ? incidentLimits.resolutionMin : action === "object" ? incidentLimits.objectionMin : 0;
    const max = action === "start" ? incidentLimits.noteMax : action === "resolve" ? incidentLimits.resolutionMax : incidentLimits.objectionMax;
    if (action !== "acknowledge" && (text.trim().length < limits || text.trim().length > max)) {
      setFieldError(`Nội dung cần từ ${limits} đến ${max} ký tự.`);
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
            ? await startIncident(incident.id, incident.version, key, text.trim())
            : action === "resolve"
              ? await resolveIncident(incident.id, incident.version, key, text.trim())
              : await objectIncident(incident.id, incident.version, key, text.trim());
      const refreshed = await getIncident(body.incident.id);
      setIncident(refreshed.incident);
      setEvents(refreshed.events);
      setPending(null);
      setNote("");
      setNotice("Đã ghi nhận thao tác.");
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
                <EvidenceList images={incident.attachments} />
              </DetailBlock>
              {incident.resolutionSummary ? (
                <DetailBlock title="Kết quả xử lý">
                  <p className="whitespace-pre-wrap text-base leading-7 text-ink">{incident.resolutionSummary}</p>
                  <dl>
                    <IncidentFact term="Gửi lúc" value={formatWhen(incident.resolvedAt)} />
                  </dl>
                </DetailBlock>
              ) : null}
              {incident.objectionReason ? (
                <DetailBlock title="Phản đối kết quả">
                  <p className="whitespace-pre-wrap text-base leading-7 text-ink">{incident.objectionReason}</p>
                  <p className="text-sm leading-relaxed text-muted">Kết quả trước đó vẫn nằm trong dòng thời gian.</p>
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
                {!incident.capabilities.acknowledge && !incident.capabilities.start && !incident.capabilities.resolve && !incident.capabilities.object ? (
                  <p className="text-sm text-muted">Không có thao tác xử lý cho vai trò của bạn ở trạng thái này.</p>
                ) : null}
                {pending ? (
                  <div className="rounded-xl border border-line bg-canvas p-3">
                    <p className="text-sm font-semibold text-ink">
                      {pending === "acknowledge" ? "Xác nhận tiếp nhận sự cố này?" : pending === "start" ? "Ghi chú khi bắt đầu xử lý" : pending === "resolve" ? "Kết quả xử lý" : "Lý do phản đối"}
                    </p>
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

function EvidenceList({ images }: { images: { id: string }[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const ids = images.map((image) => image.id).join(",");
  useEffect(() => {
    const list = ids.length === 0 ? [] : ids.split(",");
    let cancelled = false;
    const created: string[] = [];
    for (const id of list) {
      void fetchIncidentEvidenceUrl(id)
        .then((url) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          created.push(url);
          setUrls((current) => ({ ...current, [id]: url }));
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [ids]);
  if (images.length === 0) return <p className="text-sm leading-relaxed text-muted">Không có ảnh chứng cứ.</p>;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Ảnh chứng cứ">
      {images.map((image, index) => (
        <li key={image.id}>
          {urls[image.id] ? (
            <img src={urls[image.id]} alt={`Ảnh chứng cứ ${index + 1}`} className="h-24 w-32 rounded-lg border border-line object-cover" />
          ) : (
            <div className="h-24 w-32 rounded-lg border border-line bg-canvas" />
          )}
        </li>
      ))}
    </ul>
  );
}

function IncidentFact({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-line py-2 last:border-b-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{term}</dt>
      <dd className="text-base font-semibold leading-relaxed text-ink">{value}</dd>
    </div>
  );
}
