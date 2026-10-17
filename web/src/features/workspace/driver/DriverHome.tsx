import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, primaryLinkClass, shipmentTone, windowText } from "@/features/workspace/format";
import { EmptyPanel, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { DriverShipment } from "@/models/publishedShipment";
import { listDriverShipments } from "@/services/shipmentService";

const actionLabel = {
  pickup: "Xác nhận lấy hàng",
  delivery: "Xác nhận giao hàng",
  none: "Xem chuyến",
} as const;

export function DriverHome() {
  usePageTitle("Tài xế");
  const { snapshot, logout } = useAuth();
  const email = snapshot.status === "authenticated" ? snapshot.user.email : "";
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

  const next = shipments.find((item) => item.nextAction !== "none") ?? shipments[0] ?? null;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Chuyến được phân công"
        summary={`${email} chỉ thấy chuyến nhà xe đã gán cho tài khoản này. Tài xế không mở sàn và không nhận chuyến.`}
        action={
          <Link to={paths.driverTrips} className={primaryLinkClass}>
            Chuyến của tôi
          </Link>
        }
      />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến được phân công.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được chuyến. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && shipments.length === 0 ? (
        <EmptyPanel title="Chưa có chuyến được phân công" body="Khi nhà xe gán chuyến cho tài khoản này, chuyến sẽ hiện tại đây để xác nhận lấy hàng và giao hàng." />
      ) : null}
      {state === "ready" && next ? (
        <article className="rounded-2xl border border-line bg-surface p-5">
          <StatusBadge tone={shipmentTone(next.status, next.vehicleId, next.driverId)}>{next.statusLabel}</StatusBadge>
          <h2 className="mt-3 text-xl font-bold text-ink">
            {next.pickupLocation} → {next.deliveryLocation}
          </h2>
          <p className="mt-2 text-sm text-muted">{next.cargoDescription}</p>
          <p className="mt-2 text-sm text-ink">Lấy: {windowText(next.pickupDate, next.pickupTimeFrom, next.pickupTimeTo)}</p>
          <p className="text-sm text-ink">Xe: {next.vehicleLabel ?? "Xe đã phân công"} · {money(next.listedPriceVnd)}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">Xác nhận lấy hoặc giao không phải thanh toán. Vị trí chuyến chưa mở.</p>
          <Link to={`${paths.driverTrips}/${next.id}`} className={`${primaryLinkClass} mt-4`}>
            {actionLabel[next.nextAction]}
          </Link>
        </article>
      ) : null}
    </section>
  );
}
