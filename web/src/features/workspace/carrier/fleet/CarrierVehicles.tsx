import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { FleetNav } from "@/features/workspace/carrier/fleet/FleetNav";
import { PageHeader } from "@/features/workspace/ui";
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
      {state === "ready" && vehicles.length === 0 ? <p className="text-sm text-ink">Chưa có xe nào. Hãy thêm phương tiện khi nhà xe đã có xe lạnh.</p> : null}
      {state === "ready" && vehicles.length > 0 ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold text-ink">
                <Link to={`${paths.carrierFleet}/xe/${vehicle.id}`} className="hover:text-navy">
                  {vehicle.label}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted">{vehicle.plate ?? "Chưa có biển số"} · {vehicle.vehicleKindLabel ?? "Chưa có loại xe"}</p>
              <p className="mt-1 text-sm text-ink">{vehicle.temperatureLabel ?? "Chưa có nhóm nhiệt"} · {vehicle.capacityTon == null ? "Chưa có tải trọng" : `${vehicle.capacityTon} tấn`}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
