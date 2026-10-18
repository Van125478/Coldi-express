import { MapPinned } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { primaryLinkClass } from "@/features/workspace/format";
import { followedShipment, shipperBucket } from "@/features/workspace/shipper/shipperGroups";
import { ShipperShipmentCard } from "@/features/workspace/shipper/ShipperShipmentCard";
import { WorldOilPriceWidget } from "@/features/market/WorldOilPriceWidget";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { PublishedShipment } from "@/models/publishedShipment";
import { listMyShipments } from "@/services/shipmentService";

const sections = [
  { bucket: "published", title: "Đang tìm xe", hint: "Chưa có nhà xe nhận." },
  { bucket: "matched", title: "Đã có nhà xe nhận", hint: "Đã nhận. Chưa xác nhận lấy hàng." },
  { bucket: "transit", title: "Đang vận chuyển", hint: "Tài xế đã xác nhận lấy hàng." },
  { bucket: "delivered", title: "Đã giao", hint: "Đã xác nhận giao. Chưa phải đã thanh toán." },
] as const;

export function ShipperDashboard() {
  usePageTitle("Trang chủ chủ hàng");
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

  const followed = followedShipment(shipments);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tạo đơn và quản lý vận chuyển"
        summary="Theo dõi đơn đang tìm xe, đã có nhà xe nhận và đang giao."
        action={
          state === "ready" && shipments.length === 0 ? undefined : (
            <Link to={paths.shipperCreate} className={primaryLinkClass}>
              Đăng đơn hàng
            </Link>
          )
        }
      />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải đơn của bạn.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được đơn. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && shipments.length === 0 ? (
        <EmptyPanel
          title="Chưa có đơn"
          body="Đăng đơn để niêm yết điểm lấy, điểm giao, hàng hóa và giá. Đơn mới ở trạng thái Đang tìm xe."
          action={
            <Link to={paths.shipperCreate} className={primaryLinkClass}>
              Đăng đơn hàng
            </Link>
          }
        />
      ) : null}
      {state === "ready" && followed ? (
        <article className="rounded-2xl bg-navy p-5 text-white sm:p-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-white/80">{followed.status === "IN_TRANSIT" ? "ĐANG VẬN CHUYỂN" : "CHUYẾN ĐANG THEO DÕI"}</p>
          <h2 className="sr-only">
            {followed.pickupLocation} đến {followed.deliveryLocation}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/70">Điểm lấy</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">{followed.pickupLocation}</p>
            </div>
            <span className="hidden text-2xl text-white/70 sm:block" aria-hidden="true">
              →
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/70">Điểm giao</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">{followed.deliveryLocation}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/85">
            {followed.temperatureLabel}
            {followed.cargoWeightTon === null ? "" : ` · ${followed.cargoWeightTon} tấn`}
            {" · "}
            {followed.cargoDescription}
          </p>
          <p className="mt-2 text-sm text-white/85">
            {followed.vehicleId !== null && followed.driverId !== null
              ? `${followed.vehicleLabel ?? "Xe đã phân công"} · ${followed.driverName ?? "Tài xế đã phân công"}`
              : "Chưa phân công xe và tài xế."}
          </p>
          <Link
            to={followed.status === "IN_TRANSIT" ? `${paths.shipperShipments}/${followed.id}#vi-tri` : `${paths.shipperShipments}/${followed.id}`}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy"
          >
            <MapPinned className="size-4" aria-hidden="true" />
            {followed.status === "IN_TRANSIT" ? "Xem vị trí" : "Xem đơn"}
          </Link>
        </article>
      ) : null}
      {state === "ready" && shipments.length > 0
        ? sections.map((section) => {
            const items = shipments.filter((item) => shipperBucket(item.status) === section.bucket);
            if (items.length === 0) return null;
            return (
              <section key={section.bucket} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-ink">
                      {section.title} · {items.length}
                    </h2>
                    <p className="text-sm text-muted">{section.hint}</p>
                  </div>
                  <Link to={`${paths.shipperShipments}?trang=${section.bucket}`} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
                    Xem nhóm này
                  </Link>
                </div>
                <ul className="grid gap-4 md:grid-cols-2">
                  {items.slice(0, 2).map((shipment) => (
                    <li key={shipment.id}>
                      <ShipperShipmentCard shipment={shipment} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        : null}
      {state === "ready" && shipments.some((item) => shipperBucket(item.status) === "other") ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink">Trạng thái khác</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {shipments
              .filter((item) => shipperBucket(item.status) === "other")
              .map((shipment) => (
                <li key={shipment.id}>
                  <ShipperShipmentCard shipment={shipment} />
                </li>
              ))}
          </ul>
        </section>
      ) : null}
      <WorldOilPriceWidget variant="compact" />
    </section>
  );
}
