import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { currentDriverTrip, driverCounts } from "@/features/workspace/driver/driverLanes";
import { DriverTripCard } from "@/features/workspace/driver/DriverTripCard";
import { lostSession } from "@/features/workspace/sessionLoss";
import { EmptyPanel } from "@/features/workspace/ui";
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

  return (
    <section className="space-y-8">
      <div className="flex max-w-3xl flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-navy">CHÀO MỪNG TRỞ LẠI</p>
          <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{email || "Tài xế"}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Chuyến nhà xe đã gán cho tài khoản này hiện ở đây.</p>
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
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,36rem)]">
          <ul className="grid grid-cols-3 overflow-hidden rounded-2xl bg-navy text-white xl:grid-cols-1">
            {countLinks.map((item) => (
              <li key={item.key} className="min-w-0 border-white/15 max-xl:border-l max-xl:first:border-l-0 xl:border-t xl:first:border-t-0">
                <Link to={item.href} className="flex min-h-24 flex-col items-center justify-center px-3 py-4 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white xl:items-start xl:px-5">
                  <span className="text-3xl font-extrabold tabular-nums">{counts[item.key]}</span>
                  <span className="mt-1 text-xs font-semibold leading-snug">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="min-w-0 space-y-4">
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
            {current ? <DriverTripCard shipment={current} /> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
