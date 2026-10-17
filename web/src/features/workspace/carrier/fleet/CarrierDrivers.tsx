import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { carrierDriverPath } from "@/app/paths";
import { FleetNav } from "@/features/workspace/carrier/fleet/FleetNav";
import { PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierDriver } from "@/models/publishedShipment";
import { listCarrierDrivers } from "@/services/shipmentService";

export function CarrierDrivers() {
  usePageTitle("Tài xế");
  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    listCarrierDrivers()
      .then((body) => {
        if (!active) return;
        setDrivers(body.drivers);
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
      <PageHeader title="Tài xế" summary="Danh sách tài xế đã liên kết với nhà xe này. Tạo tài khoản tài xế chưa mở." />
      <FleetNav current="drivers" />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải danh sách tài xế.</p> : null}
      {state === "error" ? <p className="text-sm text-ink">Không tải được danh sách tài xế.</p> : null}
      {state === "ready" && drivers.length === 0 ? <p className="text-sm text-ink">Chưa có tài xế liên kết.</p> : null}
      {state === "ready" && drivers.length > 0 ? (
        <ul className="grid gap-3">
          {drivers.map((driver) => (
            <li key={driver.id} className="rounded-2xl border border-line bg-surface px-5 py-4">
              <Link to={carrierDriverPath(driver.id)} className="text-base font-bold text-ink hover:text-navy">
                {driver.displayName ?? "Chưa có tên"}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
