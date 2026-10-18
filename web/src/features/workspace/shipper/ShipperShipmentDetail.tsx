import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { reportableShipmentStatuses, reportIncidentPath } from "@/features/incidents/incidentCopy";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { civil, money, shipmentTone, windowText } from "@/features/workspace/format";
import { CargoImageGallery } from "@/features/shipments/CargoImageGallery";
import { ShipperChat } from "@/features/workspace/chat/ShipperChat";
import { CommissionPanel } from "@/features/commission/CommissionPanel";
import { ShipmentLocation } from "@/features/workspace/gps/ShipmentLocation";
import { ShipmentTimeline } from "@/features/workspace/ShipmentTimeline";
import { DetailBlock, FactLine, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { PublishedShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { getMyShipment } from "@/services/shipmentService";

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">{value}</p>
    </div>
  );
}

function assignmentNote(status: string): string {
  if (status === "IN_TRANSIT") return "Đang vận chuyển.";
  if (status === "DELIVERY_CONFIRMED") return "Đã xác nhận giao hàng.";
  return "Chưa xác nhận lấy hàng.";
}

function contact(name: string | null, phone: string | null, email: string | null): string {
  const value = [name, phone, email].filter(Boolean).join(" · ");
  return value.length > 0 ? value : "Chưa có";
}

export function ShipperShipmentDetail() {
  usePageTitle("Chi tiết đơn");
  const { id } = useParams();
  const { logout } = useAuth();
  const [shipment, setShipment] = useState<PublishedShipment | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!id) return;
    let active = true;
    getMyShipment(id)
      .then((body) => {
        if (!active) return;
        setShipment(body.shipment);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState(error instanceof ApiError && (error.status === 404 || error.status === 403) ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [id, logout]);

  return (
    <section className="space-y-6">
      <Link to={paths.shipperShipments} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Đơn của tôi
      </Link>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải đơn.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy đơn này trong tài khoản của bạn.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được đơn. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && shipment ? (
        <>
          <PageHeader title={`${shipment.pickupLocation} → ${shipment.deliveryLocation}`} summary={shipment.cargoDescription} />
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
            <p className="text-sm text-muted">
              Mã đơn <span className="font-medium text-ink">{shipment.id}</span>
            </p>
            {reportableShipmentStatuses.includes(shipment.status as (typeof reportableShipmentStatuses)[number]) ? (
              <Button asChild variant="outline">
                <Link to={reportIncidentPath("SHIPPER", shipment.id)}>Báo sự cố</Link>
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FactTile label="Loại hàng" value={shipment.cargoDescription} />
            <div className="sm:col-span-2 xl:col-span-4">
              <CargoImageGallery images={shipment.cargoImages} />
            </div>
            <FactTile label="Tải trọng" value={shipment.cargoWeightTon === null ? "Chưa có" : `${shipment.cargoWeightTon} tấn`} />
            <FactTile label="Yêu cầu xe" value={shipment.vehicleRequirement} />
            <FactTile label="Nhóm nhiệt" value={shipment.temperatureLabel} />
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)]">
            <div className="space-y-4">
              <DetailBlock title="Lấy hàng">
                <FactLine term="Kho gửi" value={[shipment.pickupCompany, shipment.pickupLocation].filter(Boolean).join(" — ") || "Chưa có"} />
                <FactLine term="Liên hệ" value={contact(shipment.pickupContactName, shipment.pickupPhone, shipment.pickupEmail)} />
                <FactLine term="Lịch" value={windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)} />
              </DetailBlock>
              <DetailBlock title="Giao hàng">
                <FactLine term="Kho nhận" value={[shipment.deliveryCompany, shipment.deliveryLocation].filter(Boolean).join(" — ") || "Chưa có"} />
                <FactLine term="Liên hệ" value={contact(shipment.deliveryContactName, shipment.deliveryPhone, shipment.deliveryEmail)} />
                <FactLine term="Lịch" value={windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)} />
              </DetailBlock>
              <DetailBlock title="Hàng hóa">
                <FactLine term="Mô tả" value={shipment.cargoDescription} />
                <FactLine term="Nhóm nhiệt" value={shipment.temperatureLabel} />
                <FactLine term="Khối lượng" value={`${shipment.cargoWeightTon ?? "Chưa có"} tấn · ${shipment.cargoVolumeM3 ?? "Chưa có"} m³ · ${shipment.packageCount ?? "Chưa có"} thùng`} />
                <FactLine term="Yêu cầu xe" value={shipment.vehicleRequirement} />
              </DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock title="Cước niêm yết">
                <p className="text-2xl font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
                <p className="text-sm text-muted">Giá chủ hàng nhập khi đăng đơn. Chưa phải thanh toán.</p>
              </DetailBlock>
              <CommissionPanel shipmentId={shipment.id} />
              <DetailBlock title="Phân công">
                {shipment.vehicleId !== null && shipment.driverId !== null ? (
                  <>
                    <FactLine term="Xe" value={shipment.vehicleLabel ?? "Xe đã phân công"} />
                    <FactLine term="Tài xế" value={shipment.driverName ?? "Tài xế đã phân công"} />
                    <p className="text-sm text-muted">{assignmentNote(shipment.status)}</p>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-ink">
                    {shipment.status === "PUBLISHED" ? "Đơn đang mở, chưa có nhà xe nhận." : "Đã có nhà xe nhận. Chưa phân công xe và tài xế."}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-muted">Ngày tạo {civil(shipment.createdAt.slice(0, 10))}.</p>
              </DetailBlock>
            </div>
          </div>
          <div id="vi-tri" className="scroll-mt-24">
            <ShipmentLocation shipmentId={shipment.id} />
          </div>
          <ShipperChat shipmentId={shipment.id} claimed={shipment.carrierId != null} route={`${shipment.pickupLocation} → ${shipment.deliveryLocation}`} />
          <ShipmentTimeline timeline={shipment.timeline} />
        </>
      ) : null}
    </section>
  );
}
