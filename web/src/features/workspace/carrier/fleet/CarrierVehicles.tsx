import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { FleetNav } from "@/features/workspace/carrier/fleet/FleetNav";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierVehicle } from "@/models/publishedShipment";
import { listCarrierVehicles } from "@/services/shipmentService";

export function CarrierVehicles() {
  usePageTitle("Đội xe");
  const [vehicles, setVehicles] = useState<CarrierVehicle[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    listCarrierVehicles()
      .then((body) => {
        if (!active) return;
        setVehicles(body.vehicles);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

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
