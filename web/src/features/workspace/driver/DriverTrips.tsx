import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, shipmentTone, windowText } from "@/features/workspace/format";
import { EmptyPanel, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { DriverShipment } from "@/models/publishedShipment";
import { listDriverShipments } from "@/services/shipmentService";

export function DriverTrips() {
  usePageTitle("Chuyến của tôi");
  const { logout } = useAuth();
  const [shipments, setShipments] = useState<DriverShipment[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    listDriverShipments()
      .then((body) => {
        if (!active) return;
        setShipments(body.shipments);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [logout]);

  const ordered = [...shipments].sort((left, right) => Number(left.nextAction === "none") - Number(right.nextAction === "none"));

  return (
    <section className="space-y-6">
      <PageHeader title="Chuyến của tôi" summary="Chuyến nhà xe đã gán cho tài khoản này. Chuyến còn việc xác nhận được xếp phía trên." />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến được phân công.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được chuyến. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && ordered.length === 0 ? (
        <EmptyPanel title="Chưa có chuyến được phân công" body="Khi nhà xe gán chuyến, chuyến sẽ hiện tại đây." />
      ) : null}
      {state === "ready" && ordered.length > 0 ? (
        <ul className="grid gap-4">
          {ordered.map((shipment) => (
            <li key={shipment.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
                  <h2 className="mt-2 text-lg font-bold text-ink">
                    <Link to={`${paths.driverTrips}/${shipment.id}`} className="hover:text-navy">
                      {shipment.pickupLocation} → {shipment.deliveryLocation}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-muted">{shipment.cargoDescription} · {shipment.temperatureLabel}</p>
                </div>
                <p className="text-sm font-semibold text-ink">{money(shipment.listedPriceVnd)}</p>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                <p>Lấy: {windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</p>
                <p>Giao: {windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)}</p>
                <p>Xe: {shipment.vehicleLabel ?? "Xe đã phân công"}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
