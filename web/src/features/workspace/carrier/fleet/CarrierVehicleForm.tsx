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

type Draft = {
  label: string;
  plate: string;
  vehicleKind: string;
  temperatureGroup: string;
  capacityTon: string;
};

const emptyDraft: Draft = { label: "", plate: "", vehicleKind: "", temperatureGroup: "", capacityTon: "" };

export function CarrierVehicleForm({ mode }: { mode: "create" | "edit" }) {
  usePageTitle(mode === "create" ? "Thêm phương tiện" : "Chỉnh sửa xe");
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(mode === "create" ? "ready" : "loading");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const capacityTon = Number(draft.capacityTon);
    if (!Number.isFinite(capacityTon)) {
      setNotice("Tải trọng không hợp lệ.");
      return;
    }
    const input = {
      label: draft.label,
      plate: draft.plate,
      vehicleKind: draft.vehicleKind,
      temperatureGroup: draft.temperatureGroup,
      capacityTon,
    };
    setPending(true);
    setNotice(null);
    try {
      const body = mode === "create" || !id ? await createCarrierVehicle(input) : await updateCarrierVehicle(id, input);
      navigate(`${paths.carrierFleet}/xe/${body.vehicle.id}`, { replace: true, state: { saved: true } });
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Không lưu được xe.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-6">
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
          className="space-y-4 rounded-2xl border border-line bg-surface p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-navy">Nhận diện xe</legend>
            <Field label="Tên xe" value={draft.label} onChange={(value) => update("label", value)} />
            <Field label="Biển số" value={draft.plate} onChange={(value) => update("plate", value)} />
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-navy">Khả năng chở</legend>
          <label className="block space-y-2 text-sm font-semibold text-ink">
            Loại phương tiện
            <select className={fieldClass} value={draft.vehicleKind} onChange={(event) => update("vehicleKind", event.target.value)}>
              <option value="">Chọn loại</option>
              <option value="REEFER_TRUCK">Xe tải lạnh</option>
              <option value="REEFER_CONTAINER">Container lạnh</option>
              <option value="REEFER_VAN">Xe van lạnh</option>
            </select>
          </label>
          <label className="block space-y-2 text-sm font-semibold text-ink">
            Nhóm nhiệt độ hỗ trợ
            <select className={fieldClass} value={draft.temperatureGroup} onChange={(event) => update("temperatureGroup", event.target.value)}>
              <option value="">Chọn nhóm</option>
              <option value="COOL">Lạnh mát</option>
              <option value="FROZEN">Đông</option>
              <option value="DEEP_FROZEN">Cực lạnh</option>
            </select>
          </label>
          <Field label="Tải trọng (tấn)" value={draft.capacityTon} onChange={(value) => update("capacityTon", value)} inputMode="decimal" />
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

function Field({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (value: string) => void; inputMode?: "decimal" }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-ink">
      {label}
      <input className={fieldClass} value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
