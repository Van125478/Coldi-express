import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assignmentPath, paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, primaryLinkClass, shipmentTone } from "@/features/workspace/format";
import { MetricGrid, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierShipment } from "@/models/publishedShipment";
import { listCarrierShipments, listClaimedShipments } from "@/services/shipmentService";

export function CarrierDashboard() {
  usePageTitle("Tổng quan nhà xe");
  const { logout } = useAuth();
  const [available, setAvailable] = useState<CarrierShipment[]>([]);
  const [claimed, setClaimed] = useState<CarrierShipment[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    Promise.all([listCarrierShipments(), listClaimedShipments()])
      .then(([open, mine]) => {
        if (!active) return;
        setAvailable(open.shipments);
        setClaimed(mine.shipments);
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

  const waiting = claimed.filter((item) => item.status === "MATCHED" && (item.vehicleId === null || item.driverId === null));
  const awaitingPickup = claimed.filter((item) => item.status === "MATCHED" && item.vehicleId !== null && item.driverId !== null);
  const later = claimed.filter((item) => item.status !== "MATCHED");
  const ordered = [...waiting, ...awaitingPickup, ...later];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Việc của nhà xe"
        summary="Xem đơn đang mở, chuyến đã nhận và chuyến còn thiếu xe hoặc tài xế."
        action={
          <Link to={paths.carrierFind} className={primaryLinkClass}>
            Tìm chuyến
          </Link>
        }
      />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được chuyến. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" ? (
        <>
          <MetricGrid
            items={[
              { label: "Đơn đang mở", value: available.length, hint: "Có thể nhận. Gọi điện không giữ chỗ." },
              { label: "Đã nhận", value: claimed.length, hint: "Chuyến của nhà xe này." },
              { label: "Chờ phân công", value: waiting.length, hint: "Chưa gán xe và tài xế." },
              { label: "Chờ lấy hàng", value: awaitingPickup.length, hint: "Đã phân công. Chưa xác nhận lấy hàng." },
            ]}
          />
          {available.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-4 text-sm leading-relaxed text-muted">
              Không có đơn đang tìm xe. Khi chủ hàng niêm yết đơn mới, đơn sẽ hiện tại Tìm chuyến.
            </p>
          ) : (
            <div>
              <h2 className="text-base font-bold text-ink">Đơn có thể nhận</h2>
              <ul className="mt-3 grid gap-3 lg:grid-cols-2">
                {available.slice(0, 4).map((shipment) => (
                  <li key={shipment.id} className="rounded-2xl border border-line bg-surface">
                    <TripRow shipment={shipment} action="Xem đơn" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-base font-bold text-ink">Chuyến đã nhận</h2>
              <Link to={paths.carrierTrips} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
                Chuyến của tôi
              </Link>
            </div>
            {ordered.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Chưa nhận chuyến nào.</p> : null}
            <ul>
              {ordered.slice(0, 5).map((shipment) => (
                <li key={shipment.id} className="border-b border-line last:border-b-0">
                  <TripRow shipment={shipment} action={shipment.vehicleId === null || shipment.driverId === null ? "Phân công" : "Xem"} />
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}

function TripRow({ shipment, action }: { shipment: CarrierShipment; action: string }) {
  const needsAssignment = shipment.vehicleId === null || shipment.driverId === null;
  const href = needsAssignment && shipment.status !== "PUBLISHED" ? assignmentPath(shipment.id) : `${paths.carrierHome}/chuyen/${shipment.id}`;
  return (
    <div className="grid items-center gap-3 px-5 py-4 lg:grid-cols-[max-content_minmax(0,1.3fr)_minmax(0,1fr)_auto_auto]">
      <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
      <p className="font-semibold text-ink">
        {shipment.pickupLocation} → {shipment.deliveryLocation}
      </p>
      <p className="text-sm text-muted">{shipment.cargoDescription}</p>
      <p className="text-sm font-semibold text-ink">{money(shipment.listedPriceVnd)}</p>
      <Link to={href} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        {action}
      </Link>
    </div>
  );
}
