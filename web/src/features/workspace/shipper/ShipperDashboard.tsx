import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, primaryLinkClass, shipmentTone, windowText } from "@/features/workspace/format";
import { EmptyPanel, MetricGrid, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { PublishedShipment } from "@/models/publishedShipment";
import { listMyShipments } from "@/services/shipmentService";

export function ShipperDashboard() {
  usePageTitle("Tổng quan chủ hàng");
  const { logout } = useAuth();
  const [shipments, setShipments] = useState<PublishedShipment[]>([]);
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

  const published = shipments.filter((item) => item.status === "PUBLISHED").length;
  const waiting = shipments.filter((item) => item.status === "MATCHED" && (item.vehicleId === null || item.driverId === null)).length;
  const assigned = shipments.filter((item) => item.status === "MATCHED" && item.vehicleId !== null && item.driverId !== null).length;
  const featured = shipments.find((item) => item.status === "PUBLISHED") ?? shipments.find((item) => item.vehicleId === null) ?? shipments[0] ?? null;
  const recent = shipments.filter((item) => item.id !== featured?.id).slice(0, 4);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Đơn vận chuyển"
        summary="Theo dõi đơn đang tìm xe, đơn đã có nhà xe nhận và đơn đã được phân công."
        action={
          <Link to={paths.shipperCreate} className={primaryLinkClass}>
            Tạo đơn
          </Link>
        }
      />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải đơn của bạn.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được đơn. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" ? (
        <>
          <MetricGrid
            items={[
              { label: "Tổng đơn", value: shipments.length, hint: "Đơn tài khoản này đã niêm yết." },
              { label: "Đang tìm xe", value: published, hint: "Chưa có nhà xe nhận." },
              { label: "Chờ phân công", value: waiting, hint: "Đã nhận, chưa gán xe và tài xế." },
              { label: "Chờ lấy hàng", value: assigned, hint: "Đã phân công. Chưa xác nhận lấy hàng." },
            ]}
          />
          {featured ? (
            <article className="grid gap-5 rounded-2xl border border-line bg-surface p-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center lg:p-6">
              <div>
                <StatusBadge tone={shipmentTone(featured.status, featured.vehicleId, featured.driverId)}>{featured.statusLabel}</StatusBadge>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
                  {featured.pickupLocation} → {featured.deliveryLocation}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {[featured.pickupCompany, featured.deliveryCompany].filter(Boolean).join(" → ") || featured.cargoDescription}
                </p>
                <p className="mt-3 text-sm text-ink">
                  {featured.cargoDescription} · {featured.temperatureLabel} · {featured.vehicleRequirement}
                </p>
                <p className="mt-1 text-sm text-muted">Lấy hàng: {windowText(featured.pickupDate, featured.pickupTimeFrom, featured.pickupTimeTo)}</p>
              </div>
              <div className="flex flex-col gap-3 border-line lg:border-l lg:pl-6">
                <p className="text-sm text-muted">Giá niêm yết</p>
                <p className="text-2xl font-extrabold text-navy">{money(featured.listedPriceVnd)}</p>
                <Link to={`${paths.shipperShipments}/${featured.id}`} className={primaryLinkClass}>
                  Xem đơn
                </Link>
              </div>
            </article>
          ) : (
            <EmptyPanel title="Chưa có đơn" body="Tạo đơn để niêm yết điểm lấy, điểm giao, hàng hóa và giá." action={<Link to={paths.shipperCreate} className={primaryLinkClass}>Tạo đơn</Link>} />
          )}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-base font-bold text-ink">Đơn gần đây</h2>
              <Link to={paths.shipperShipments} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
                Tất cả đơn
              </Link>
            </div>
            {recent.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Không có đơn nào khác.</p> : null}
            <ul>
              {recent.map((shipment) => (
                <li key={shipment.id} className="grid items-center gap-3 border-b border-line px-5 py-4 last:border-b-0 lg:grid-cols-[max-content_minmax(0,1.3fr)_minmax(0,1fr)_auto_auto]">
                  <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
                  <p className="font-semibold text-ink">
                    {shipment.pickupLocation} → {shipment.deliveryLocation}
                  </p>
                  <p className="text-sm text-muted">{shipment.cargoDescription}</p>
                  <p className="text-sm font-semibold text-ink">{money(shipment.listedPriceVnd)}</p>
                  <Link to={`${paths.shipperShipments}/${shipment.id}`} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
                    Xem
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}
