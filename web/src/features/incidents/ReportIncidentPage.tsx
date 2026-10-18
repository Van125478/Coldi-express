import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/useAuth";
import { incidentDetailPath, incidentKey, incidentLimits, incidentListPath, incidentTypeLabels, incidentTypes, reportableShipmentStatuses, type IncidentType } from "@/features/incidents/incidentCopy";
import { Field } from "@/features/incidents/incidentUi";
import { lostSession } from "@/features/workspace/sessionLoss";
import { PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { BusinessRole } from "@/models/session";
import { ApiError } from "@/services/apiClient";
import { createIncident } from "@/services/incidentService";
import { getCarrierShipment, getDriverShipment, getMyShipment } from "@/services/shipmentService";

type Errors = Partial<Record<"incidentType" | "title" | "description" | "occurredAt", string>>;

const evidenceNote = "Ảnh chứng cứ chưa mở vì chưa có kho riêng và bước kiểm tra nội dung. Báo cáo bằng chữ vẫn được ghi nhận.";

export function ReportIncidentPage() {
  usePageTitle("Báo sự cố");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const shipmentId = params.get("shipmentId") ?? "";
  const idempotencyKey = useRef(incidentKey("create"));
  const { snapshot, logout } = useAuth();
  const role: BusinessRole = snapshot.status === "authenticated" ? snapshot.user.role : "SHIPPER";
  const [label, setLabel] = useState("");
  const [reportable, setReportable] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!shipmentId) {
      setState("missing");
      return;
    }
    let active = true;
    setState("loading");
    const load = role === "CARRIER" ? getCarrierShipment(shipmentId) : role === "DRIVER" ? getDriverShipment(shipmentId) : getMyShipment(shipmentId);
    load
      .then((body) => {
        if (!active) return;
        const shipment = body.shipment;
        setLabel(`${shipment.pickupLocation} → ${shipment.deliveryLocation}`);
        setReportable(reportableShipmentStatuses.includes(shipment.status as (typeof reportableShipmentStatuses)[number]));
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState(error instanceof ApiError && (error.status === 404 || error.status === 403) ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [logout, reloadKey, role, shipmentId]);

  useEffect(() => {
    const order = ["incidentType", "title", "description", "occurredAt"] as const;
    const first = order.find((field) => errors[field]);
    if (first) document.getElementById(first)?.focus();
  }, [errors]);

  function clearError(field: keyof Errors) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submit() {
    const next: Errors = {};
    if (!incidentTypes.includes(incidentType as IncidentType)) next.incidentType = "Chọn một loại sự cố trong danh sách.";
    if (title.trim().length < incidentLimits.titleMin || title.trim().length > incidentLimits.titleMax) {
      next.title = `Tiêu đề cần từ ${incidentLimits.titleMin} đến ${incidentLimits.titleMax} ký tự.`;
    }
    if (description.trim().length < incidentLimits.descriptionMin || description.trim().length > incidentLimits.descriptionMax) {
      next.description = `Mô tả cần từ ${incidentLimits.descriptionMin} đến ${incidentLimits.descriptionMax} ký tự.`;
    }
    if (occurredAt && Number.isNaN(new Date(occurredAt).getTime())) next.occurredAt = "Thời điểm xảy ra không hợp lệ.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !incidentType) return;
    setPending(true);
    setFormError("");
    try {
      const created = await createIncident({
        shipmentId,
        incidentType,
        title: title.trim(),
        description: description.trim(),
        ...(occurredAt ? { occurredAt: new Date(occurredAt).toISOString() } : {}),
        idempotencyKey: idempotencyKey.current,
      });
      navigate(incidentDetailPath(role, created.incident.id));
    } catch (error: unknown) {
      if (lostSession(error, logout)) return;
      if (error instanceof ApiError && error.fields) {
        setErrors({
          ...(error.fields.title ? { title: error.fields.title } : {}),
          ...(error.fields.description ? { description: error.fields.description } : {}),
          ...(error.fields.incidentType ? { incidentType: error.fields.incidentType } : {}),
          ...(error.fields.occurredAt ? { occurredAt: error.fields.occurredAt } : {}),
        });
      }
      setFormError(error instanceof ApiError ? error.message : "Không gửi được báo cáo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link to={incidentListPath(role)} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Danh sách sự cố
      </Link>
      <PageHeader title="Báo sự cố" summary="Báo cáo gắn với một chuyến bạn có quyền. Chuyến hàng giữ nguyên trạng thái của nó." />
      {role === "DRIVER" ? <p className="text-sm text-muted">Chỉ gửi báo cáo khi xe đã dừng an toàn.</p> : null}
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy chuyến này trong phạm vi tài khoản của bạn.</p> : null}
      {state === "error" ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-ink">Không tải được chuyến.</p>
          <Button type="button" className="mt-3" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      ) : null}
      {state === "ready" && !reportable ? (
        <p className="text-sm text-ink">Chưa có chính sách cho phép báo sự cố ở trạng thái hiện tại của chuyến này.</p>
      ) : null}
      {state === "ready" && reportable ? (
        <form
          className="space-y-4 rounded-2xl border border-line bg-surface p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <p className="text-sm font-semibold text-ink">{label}</p>
          <Field id="incidentType" label="Loại sự cố" error={errors.incidentType}>
            <select
              id="incidentType"
              value={incidentType}
              onChange={(event) => {
                setIncidentType(event.target.value as IncidentType | "");
                clearError("incidentType");
              }}
              className="h-12 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
            >
              <option value="">Chọn loại sự cố</option>
              {incidentTypes.map((type) => (
                <option key={type} value={type}>
                  {incidentTypeLabels[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="title" label="Tiêu đề" error={errors.title}>
            <Input
              id="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearError("title");
              }}
            />
          </Field>
          <Field id="description" label="Mô tả" error={errors.description}>
            <textarea
              id="description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearError("description");
              }}
              rows={6}
              className="w-full rounded-xl border border-line bg-canvas px-3 py-3 text-sm text-ink"
            />
          </Field>
          <Field id="occurredAt" label="Thời điểm xảy ra" required={false} error={errors.occurredAt} hint="Chỉ điền nếu bạn biết. Thời điểm ghi nhận do máy chủ lưu.">
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => {
                setOccurredAt(event.target.value);
                clearError("occurredAt");
              }}
            />
          </Field>
          <p className="text-sm leading-relaxed text-muted">{evidenceNote}</p>
          {formError ? (
            <p role="alert" className="text-sm text-ink">
              {formError}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            Gửi báo cáo
          </Button>
        </form>
      ) : null}
    </section>
  );
}
