import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { FleetNav, fieldClass } from "@/features/workspace/carrier/fleet/FleetNav";
import { PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierVehicle } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { createCarrierVehicle, getCarrierVehicle, updateCarrierVehicle } from "@/services/shipmentService";
import { vehicleFieldErrors, vehicleFieldOrder, type VehicleDraft } from "@/features/workspace/carrier/fleet/vehicleFieldRules";

type Draft = VehicleDraft;

const emptyDraft: Draft = { label: "", plate: "", vehicleKind: "", temperatureGroup: "", capacityTon: "" };
const fieldIds: Record<keyof Draft, string> = {
  label: "vehicle-label",
  plate: "vehicle-plate",
  vehicleKind: "vehicle-kind",
  temperatureGroup: "vehicle-temperature",
  capacityTon: "vehicle-capacity",
};

export function CarrierVehicleForm({ mode }: { mode: "create" | "edit" }) {
  usePageTitle(mode === "create" ? "Thêm phương tiện" : "Chỉnh sửa xe");
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(mode === "create" ? "ready" : "loading");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  useEffect(() => {
    if (mode === "create" || !id) return;
    let active = true;
    getCarrierVehicle(id)
      .then((body) => {
        if (!active) return;
        setDraft(fromVehicle(body.vehicle));
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState(error instanceof ApiError && error.status === 404 ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [id, mode]);

  function update(key: keyof Draft, value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      setErrors((existing) => {
        if (!existing[key]) return existing;
        const refreshed = vehicleFieldErrors(next);
        if (refreshed[key]) return { ...existing, [key]: refreshed[key] };
        const copy = { ...existing };
        delete copy[key];
        return copy;
      });
      return next;
    });
  }

  async function save() {
    const fieldErrors = vehicleFieldErrors(draft);
    const names = vehicleFieldOrder.filter((name) => fieldErrors[name]);
    if (names.length > 0) {
      setErrors(fieldErrors);
      setNotice(null);
      const first = names[0];
      if (first) document.getElementById(fieldIds[first])?.focus();
      return;
    }
    const input = {
      label: draft.label.trim(),
      plate: draft.plate.trim(),
      vehicleKind: draft.vehicleKind as "REEFER_TRUCK" | "REEFER_CONTAINER" | "REEFER_VAN",
      temperatureGroup: draft.temperatureGroup as "COOL" | "FROZEN" | "DEEP_FROZEN",
      capacityTon: Number(draft.capacityTon.trim().replace(",", ".")),
    };
    setPending(true);
    setNotice(null);
    setErrors({});
    try {
      const body = mode === "create" || !id ? await createCarrierVehicle(input) : await updateCarrierVehicle(id, input);
      navigate(`${paths.carrierFleet}/xe/${body.vehicle.id}`, { replace: true, state: { saved: true } });
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        const serverErrors = error.fields as Partial<Record<keyof Draft, string>>;
        setErrors(serverErrors);
        const first = vehicleFieldOrder.find((name) => serverErrors[name]);
        if (first) document.getElementById(fieldIds[first])?.focus();
      } else {
        setNotice(error instanceof ApiError ? error.message : "Không lưu được xe.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <Link to={paths.carrierFleet} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Danh sách xe
      </Link>
      <PageHeader title={mode === "create" ? "Thêm phương tiện" : "Chỉnh sửa xe"} summary="Biển số không được kiểm tra với cơ quan đăng kiểm. Lưu xe không nhận chuyến." />
      <FleetNav current="vehicles" />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải xe.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy xe này.</p> : null}
      {state === "error" ? <p className="text-sm text-ink">Không tải được xe.</p> : null}
      {state === "ready" ? (
        <form
          className="space-y-8 rounded-2xl border border-line bg-surface p-5 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-navy">Nhận diện xe</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="vehicle-label" label="Tên xe" value={draft.label} error={errors.label} onChange={(value) => update("label", value)} />
              <Field id="vehicle-plate" label="Biển số" value={draft.plate} error={errors.plate} onChange={(value) => update("plate", value)} />
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-navy">Khả năng chở</legend>
            <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-semibold text-ink">
            Loại phương tiện
            <select id="vehicle-kind" aria-invalid={errors.vehicleKind !== undefined} aria-describedby={errors.vehicleKind ? "vehicle-kind-error" : undefined} className={`${fieldClass} ${errors.vehicleKind ? "border-danger" : ""}`} value={draft.vehicleKind} onChange={(event) => update("vehicleKind", event.target.value)}>
              <option value="">Chọn loại</option>
              <option value="REEFER_TRUCK">Xe tải lạnh</option>
              <option value="REEFER_CONTAINER">Container lạnh</option>
              <option value="REEFER_VAN">Xe van lạnh</option>
            </select>
            {errors.vehicleKind ? <p id="vehicle-kind-error" className="text-sm font-normal text-ink">{errors.vehicleKind}</p> : null}
          </label>
          <label className="block space-y-2 text-sm font-semibold text-ink">
            Nhóm nhiệt độ hỗ trợ
            <select id="vehicle-temperature" aria-invalid={errors.temperatureGroup !== undefined} aria-describedby={errors.temperatureGroup ? "vehicle-temperature-error" : undefined} className={`${fieldClass} ${errors.temperatureGroup ? "border-danger" : ""}`} value={draft.temperatureGroup} onChange={(event) => update("temperatureGroup", event.target.value)}>
              <option value="">Chọn nhóm</option>
              <option value="COOL">Lạnh mát</option>
              <option value="FROZEN">Đông</option>
              <option value="DEEP_FROZEN">Cực lạnh</option>
            </select>
            {errors.temperatureGroup ? <p id="vehicle-temperature-error" className="text-sm font-normal text-ink">{errors.temperatureGroup}</p> : null}
          </label>
          <Field id="vehicle-capacity" label="Tải trọng (tấn)" value={draft.capacityTon} error={errors.capacityTon} onChange={(value) => update("capacityTon", value)} inputMode="decimal" />
            </div>
          </fieldset>
          {notice ? (
            <p role="alert" className="text-sm text-ink">
              {notice}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Đang lưu" : mode === "create" ? "Thêm phương tiện" : "Lưu thay đổi"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function fromVehicle(vehicle: CarrierVehicle): Draft {
  return {
    label: vehicle.label,
    plate: vehicle.plate ?? "",
    vehicleKind: vehicle.vehicleKind ?? "",
    temperatureGroup: vehicle.temperatureGroup ?? "",
    capacityTon: vehicle.capacityTon == null ? "" : String(vehicle.capacityTon),
  };
}

function Field({ id, label, value, error, onChange, inputMode }: { id: string; label: string; value: string; error?: string; onChange: (value: string) => void; inputMode?: "decimal" }) {
  const errorId = `${id}-error`;
  return (
    <label className="block space-y-2 text-sm font-semibold text-ink" htmlFor={id}>
      {label}
      <input id={id} aria-invalid={error !== undefined} aria-describedby={error ? errorId : undefined} className={`${fieldClass} ${error ? "border-danger" : ""}`} value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
      {error ? <p id={errorId} className="text-sm font-normal text-ink">{error}</p> : null}
    </label>
  );
}
