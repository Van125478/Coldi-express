import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { currentDriverTrip, driverCounts, otherActionableTrips } from "@/features/workspace/driver/driverLanes";
import { DriverTripCard } from "@/features/workspace/driver/DriverTripCard";
import { lostSession } from "@/features/workspace/sessionLoss";
import { shipmentTone } from "@/features/workspace/format";
import { EmptyPanel, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { DriverShipment } from "@/models/publishedShipment";
import { listDriverShipments } from "@/services/shipmentService";

const countLinks = [
  { key: "pickup", label: "Chờ lấy hàng", href: `${paths.driverTrips}?nhom=pickup` },
  { key: "transit", label: "Đang vận chuyển", href: `${paths.driverTrips}?nhom=transit` },
  { key: "delivered", label: "Đã giao", href: `${paths.driverTrips}?nhom=delivered` },
] as const;

export function DriverHome() {
  usePageTitle("Tài xế");
  const { snapshot, logout } = useAuth();
  const email = snapshot.status === "authenticated" ? snapshot.user.email : "";
  const [shipments, setShipments] = useState<DriverShipment[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [logout, reloadKey]);

  const counts = driverCounts(shipments);
  const current = currentDriverTrip(shipments);
  const others = otherActionableTrips(shipments, current);

  return (
    <section className="space-y-8">
      <div className="flex max-w-3xl flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Tổng quan tài xế</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Chuyến nhà xe đã gán cho tài khoản này hiện ở đây.</p>
          {email ? <p className="mt-1 text-xs text-muted">{email}</p> : null}
        </div>
        <p className="inline-flex min-h-8 items-center rounded-full bg-navy px-3 text-xs font-semibold text-white">Tài xế</p>
      </div>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến được phân công.</p> : null}
      {state === "error" ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-ink">Không tải được chuyến.</p>
          <Button
            type="button"
            className="mt-3"
            variant="outline"
            onClick={() => {
              setState("loading");
              setReloadKey((value) => value + 1);
            }}
          >
            Thử lại
          </Button>
        </div>
      ) : null}
      {state === "ready" ? (
        <div className="space-y-6">
          <ul className="grid grid-cols-3 overflow-hidden rounded-2xl bg-navy text-white">
            {countLinks.map((item) => (
              <li key={item.key} className="min-w-0 border-l border-white/15 first:border-l-0">
                <Link to={item.href} className="flex min-h-24 flex-col items-center justify-center px-3 py-4 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white">
                  <span className="text-3xl font-extrabold tabular-nums">{counts[item.key]}</span>
                  <span className="mt-1 text-xs font-semibold leading-snug">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-extrabold text-ink">Chuyến đang cần làm</h2>
            <Link to={paths.driverTrips} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
              Chuyến của tôi
            </Link>
          </div>
          {shipments.length === 0 ? (
            <EmptyPanel title="Chưa có chuyến được phân công" body="Khi nhà xe gán chuyến cho tài khoản này, chuyến sẽ hiện tại đây để xác nhận lấy hàng và giao hàng." />
          ) : null}
          {shipments.length > 0 && current === null ? (
            <EmptyPanel title="Không có chuyến đang cần thao tác" body="Các chuyến đã giao vẫn nằm trong Chuyến của tôi." />
          ) : null}
          {current ? (
            <div className={others.length > 0 ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,22rem)]" : ""}>
              <DriverTripCard shipment={current} />
              {others.length > 0 ? (
                <aside className="space-y-3" aria-labelledby="other-trips-title">
                  <h3 id="other-trips-title" className="text-base font-bold text-ink">
                    Chuyến cần làm khác
                  </h3>
                  <ul className="space-y-3">
                    {others.map((shipment) => (
                      <li key={shipment.id} className="rounded-2xl border border-line bg-surface px-4 py-3">
                        <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
                        <p className="mt-2 text-sm font-bold leading-snug text-ink">
                          {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
                        </p>
                        <Link to={`${paths.driverTrips}/${shipment.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
                          Xem chi tiết
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
