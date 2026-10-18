import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { FleetNav } from "@/features/workspace/carrier/fleet/FleetNav";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierVehicle } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { operatingVehicleText } from "@/features/packages/planPresentation";
import { getMyPlan, type Entitlements } from "@/services/packageService";
import { archiveCarrierVehicle, listCarrierVehicles, restoreCarrierVehicle } from "@/services/shipmentService";

export function CarrierVehicles() {
  usePageTitle("Đội xe");
  const [vehicles, setVehicles] = useState<CarrierVehicle[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [plan, setPlan] = useState<Entitlements | null>(null);
  const [planState, setPlanState] = useState<"loading" | "ready" | "error">("loading");

  function reload() {
    const vehiclesTask = listCarrierVehicles().then((body) => {
      setVehicles(body.vehicles);
      setState("ready");
    });
    const planTask = getMyPlan()
      .then((body) => {
        setPlan(body.entitlements);
        setPlanState("ready");
      })
      .catch(() => {
        setPlanState("error");
      });
    return Promise.all([vehiclesTask, planTask]);
  }

  useEffect(() => {
    let active = true;
    reload()
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function archive(id: string) {
    setPendingId(id);
    setNotice(null);
    try {
      await archiveCarrierVehicle(id);
      setConfirmId(null);
      setNotice("Đã lưu trữ xe. Xe này không còn tính vào hạn mức.");
      await reload();
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Không lưu trữ được xe.");
    } finally {
      setPendingId(null);
    }
  }

  async function restore(id: string) {
    setPendingId(id);
    setNotice(null);
    try {
      await restoreCarrierVehicle(id);
      setNotice("Đã khôi phục xe vào danh sách hoạt động.");
      await reload();
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Không khôi phục được xe.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Đội xe"
        summary="Nhà xe quản lý xe của mình. Thêm xe không nhận chuyến và không tự phân công."
        action={
          <Link to={paths.carrierFleetNew} className="inline-flex min-h-11 items-center rounded-xl bg-navy px-4 text-sm font-semibold text-white">
            Thêm phương tiện
          </Link>
        }
      />
      <FleetNav current="vehicles" />
      {planState === "ready" && plan ? (
        <article className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-sm font-semibold text-navy">{plan.planName ?? "Gói hiện tại"}</p>
          <p className="mt-1 text-lg font-extrabold text-ink">{operatingVehicleText(plan.activeVehicleCount, plan.vehicleCap)}</p>
          {plan.overLimit ? <p className="mt-2 text-sm font-semibold text-ink">OVER_LIMIT. Không thêm xe hoạt động mới cho đến khi số xe nằm trong trần.</p> : null}
          <Link to={paths.carrierPlan} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Xem hoặc quản lý gói
          </Link>
        </article>
      ) : null}
      {planState === "error" ? <p role="alert" className="text-sm text-ink">Không tải được hạn mức xe từ máy chủ.</p> : null}
      {notice ? (
        <p role="status" className="text-sm text-ink">
          {notice}
        </p>
      ) : null}
      {state === "loading" ? <p className="text-sm text-muted">Đang tải danh sách xe.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được danh sách xe. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && vehicles.length === 0 ? (
        <EmptyPanel title="Chưa có xe" body="Thêm xe lạnh của nhà xe. Thêm xe không nhận chuyến và không tự phân công." />
      ) : null}
      {state === "ready" && vehicles.length > 0 ? (
        <ul className="grid gap-4 xl:grid-cols-2">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className={vehicles.length === 1 ? "xl:col-span-2" : undefined}>
              <article className="grid gap-6 rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-navy uppercase">Xe</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
                    <Link to={`${paths.carrierFleet}/xe/${vehicle.id}`} className="hover:text-navy">
                      {vehicle.label}
                    </Link>
                  </h2>
                  <p className="mt-2 font-mono text-sm font-semibold text-ink">{vehicle.plate ?? "Chưa ghi biển số"}</p>
                  <p className="mt-2 text-sm font-semibold text-navy">{vehicle.statusLabel ?? "Đang hoạt động"}</p>
                  {vehicle.status === "ARCHIVED" ? (
                    <Button type="button" className="mt-4" variant="outline" disabled={pendingId !== null} onClick={() => void restore(vehicle.id)}>
                      Khôi phục
                    </Button>
                  ) : confirmId === vehicle.id ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" disabled={pendingId !== null || vehicle.canArchive === false} onClick={() => void archive(vehicle.id)}>
                        Xác nhận lưu trữ
                      </Button>
                      <Button type="button" variant="outline" disabled={pendingId !== null} onClick={() => setConfirmId(null)}>
                        Huỷ
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" className="mt-4" variant="outline" disabled={pendingId !== null || vehicle.canArchive === false} onClick={() => setConfirmId(vehicle.id)}>
                      Lưu trữ
                    </Button>
                  )}
                  {vehicle.archiveBlockReason ? <p className="mt-2 text-sm text-muted">{vehicle.archiveBlockReason}</p> : null}
                </div>
                <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                  <Spec label="Loại" value={vehicle.vehicleKindLabel} />
                  <Spec label="Nhiệt" value={vehicle.temperatureLabel} />
                  <Spec label="Tải trọng" value={vehicle.capacityTon == null ? null : `${vehicle.capacityTon} tấn`} />
                </dl>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value ?? "Chưa ghi"}</dd>
    </div>
  );
}
