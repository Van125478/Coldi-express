import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, primaryLinkClass, shipmentTone, windowText } from "@/features/workspace/format";
import { EmptyPanel, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { PublishedShipment } from "@/models/publishedShipment";
import { listMyShipments } from "@/services/shipmentService";

export function ShipperShipments() {
  usePageTitle("Đơn của tôi");
  const { logout } = useAuth();
  const [shipments, setShipments] = useState<PublishedShipment[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    listMyShipments()
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

  const needle = query.trim().toLowerCase();
  const shown = shipments.filter((shipment) => {
    if (needle.length === 0) return true;
    const haystack = [shipment.cargoDescription, shipment.pickupLocation, shipment.deliveryLocation, shipment.pickupCompany, shipment.deliveryCompany]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Đơn của tôi"
        summary="Đơn đã lưu của tài khoản này. Ô lọc chỉ chạy trên danh sách vừa tải."
        action={
          <Link to={paths.shipperCreate} className={primaryLinkClass}>
            Tạo đơn
          </Link>
        }
      />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải đơn.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được danh sách đơn. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && shipments.length === 0 ? (
        <EmptyPanel title="Chưa có đơn" body="Đơn niêm yết sẽ hiện tại đây." action={<Link to={paths.shipperCreate} className={primaryLinkClass}>Tạo đơn</Link>} />
      ) : null}
      {state === "ready" && shipments.length > 0 ? (
        <>
          <label className="block max-w-md text-sm font-semibold text-ink" htmlFor="shipment-filter">
            Lọc theo hàng hóa hoặc địa điểm
            <Input id="shipment-filter" className="mt-2" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          {shown.length === 0 ? <p className="text-sm text-muted">Không có đơn khớp với từ vừa nhập.</p> : null}
          <ul className="grid gap-4 xl:grid-cols-2">
            {shown.map((shipment) => (
              <li key={shipment.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
                  <p className="text-sm font-semibold text-ink">{money(shipment.listedPriceVnd)}</p>
                </div>
                <h2 className="mt-3 text-lg font-bold text-ink">
                  {shipment.pickupLocation} → {shipment.deliveryLocation}
                </h2>
                <p className="mt-1 text-sm text-muted">{[shipment.pickupCompany, shipment.deliveryCompany].filter(Boolean).join(" → ")}</p>
                <p className="mt-3 text-sm text-ink">
                  {shipment.cargoDescription} · {shipment.temperatureLabel}
                  {shipment.cargoWeightTon !== null ? ` · ${shipment.cargoWeightTon} tấn` : ""} · {shipment.vehicleRequirement}
                </p>
                <p className="mt-1 text-sm text-muted">Lấy hàng: {windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</p>
                <Link to={`${paths.shipperShipments}/${shipment.id}`} className={`${primaryLinkClass} mt-4 w-fit`}>
                  Xem đơn
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
