import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assignmentPath, paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { ClaimConfirm } from "@/features/shipments/ClaimConfirm";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, primaryLinkClass, progressNote, shipmentTone, windowText } from "@/features/workspace/format";
import { CarrierChat } from "@/features/workspace/chat/CarrierChat";
import { ShipmentTimeline } from "@/features/workspace/ShipmentTimeline";
import { DetailBlock, FactLine, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { claimShipment, getCarrierShipment } from "@/services/shipmentService";

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">{value}</p>
    </div>
  );
}

export function CarrierTripDetail() {
  usePageTitle("Chi tiết chuyến");
  const { id } = useParams();
  const { logout } = useAuth();
  const [shipment, setShipment] = useState<CarrierShipment | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "conflict" | "error">("success");

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCarrierShipment(id)
      .then((body) => {
        if (!active) return;
        setShipment(body.shipment);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState(error instanceof ApiError && error.status === 404 ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [id, logout]);

  async function claim() {
    if (!shipment || pending) return;
    setPending(true);
    setNotice(null);
    try {
      const body = await claimShipment(shipment.id);
      setShipment(body.shipment);
      setNoticeTone("success");
      setNotice("Đã nhận chuyến. Chưa gán xe hay tài xế.");
      setConfirming(false);
    } catch (error) {
      if (lostSession(error, logout)) return;
      setConfirming(false);
      if (error instanceof ApiError && error.status === 409) {
        setNoticeTone("conflict");
        setNotice("Đơn này đã có nhà xe khác nhận. Chuyến không còn mở.");
        setShipment(null);
        setState("missing");
      } else {
        setNoticeTone("error");
        setNotice("Không nhận được chuyến. Hãy thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  const open = shipment?.status === "PUBLISHED" && shipment.carrierId === null;

  return (
    <section className="space-y-6">
      <Link to={open ? paths.carrierFind : paths.carrierTrips} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        {open ? "Tìm chuyến" : "Chuyến của tôi"}
      </Link>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không còn chuyến này trên sàn hoặc trong danh sách đã nhận.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được chuyến. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && shipment ? (
        <>
          <PageHeader title={`${shipment.pickupLocation} → ${shipment.deliveryLocation}`} summary={shipment.cargoDescription} />
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
            <p className="text-sm text-muted">Trạng thái lưu: {shipment.status}. Nhãn trên là cách đọc vận hành.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold tracking-wide text-muted">Điểm lấy</p>
              <p className="mt-1 text-lg font-bold text-ink">{shipment.pickupLocation}</p>
              <p className="mt-1 text-sm text-muted">{windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold tracking-wide text-muted">Điểm giao</p>
              <p className="mt-1 text-lg font-bold text-ink">{shipment.deliveryLocation}</p>
              <p className="mt-1 text-sm text-muted">{windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FactTile label="Loại hàng" value={shipment.cargoDescription} />
            <FactTile label="Tải trọng" value={shipment.cargoWeightTon === null ? "Chưa có" : `${shipment.cargoWeightTon} tấn`} />
            <FactTile label="Yêu cầu xe" value={shipment.vehicleRequirement} />
            <FactTile label="Bốc hàng" value={windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)} />
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.7fr)]">
            <div className="space-y-4">
              <DetailBlock title="Lộ trình">
                <FactLine term="Điểm lấy" value={[shipment.pickupCompany, shipment.pickupLocation].filter(Boolean).join(" — ")} />
                <FactLine term="Lịch lấy" value={windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)} />
                <FactLine term="Điểm giao" value={[shipment.deliveryCompany, shipment.deliveryLocation].filter(Boolean).join(" — ")} />
                <FactLine term="Lịch giao" value={windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)} />
              </DetailBlock>
              <DetailBlock title="Hàng hóa">
                <FactLine term="Mô tả" value={shipment.cargoDescription} />
                <FactLine term="Nhóm nhiệt" value={shipment.temperatureLabel} />
                <FactLine
                  term="Khối lượng"
                  value={`${shipment.cargoWeightTon ?? "Chưa có"} tấn · ${shipment.cargoVolumeM3 ?? "Chưa có"} m³ · ${shipment.packageCount ?? "Chưa có"} thùng`}
                />
                <FactLine term="Yêu cầu xe" value={shipment.vehicleRequirement} />
              </DetailBlock>
              <DetailBlock title="Liên hệ">
                <FactLine term="Lấy hàng" value={[shipment.pickupContactName, shipment.pickupPhone].filter(Boolean).join(" · ") || "Chưa có"} />
                <FactLine term="Giao hàng" value={[shipment.deliveryContactName, shipment.deliveryPhone].filter(Boolean).join(" · ") || "Chưa có"} />
                {shipment.pickupPhone ? (
                  <a href={`tel:${shipment.pickupPhone}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
                    Gọi điểm lấy
                  </a>
                ) : null}
                {open ? <p className="text-sm text-muted">Gọi điện hoặc nhắn tin không giữ chỗ và không nhận chuyến.</p> : null}
              </DetailBlock>
              <div id="tro-chuyen">
                <CarrierChat shipmentId={shipment.id} />
              </div>
            </div>
            <div className="space-y-4">
              <DetailBlock title="Cước niêm yết">
                <p className="text-2xl font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
              </DetailBlock>
              <DetailBlock title={open ? "Nhận chuyến" : "Phân công"}>
                {open ? (
                  <>
                    <p className="text-sm leading-relaxed text-ink">Nhận chuyến chưa gán xe hay tài xế. Chỉ một nhà xe nhận được.</p>
                    <Button type="button" disabled={pending} onClick={() => setConfirming(true)}>
                      Nhận chuyến
                    </Button>
                  </>
                ) : null}
                {!open && (shipment.vehicleId === null || shipment.driverId === null) ? (
                  <>
                    <p className="text-sm leading-relaxed text-ink">Chuyến này đã nhận. Chưa có xe và tài xế.</p>
                    <Link to={assignmentPath(shipment.id)} className={primaryLinkClass}>
                      Phân công xe và tài xế
                    </Link>
                  </>
                ) : null}
                {shipment.vehicleId !== null && shipment.driverId !== null ? (
                  <>
                    <FactLine term="Xe" value={shipment.vehicleLabel ?? "Xe đã phân công"} />
                    <FactLine term="Tài xế" value={shipment.driverName ?? "Tài xế đã phân công"} />
                    <p className="text-sm text-muted">{progressNote(shipment.status)}</p>
                  </>
                ) : null}
                {notice ? (
                  <p role={noticeTone === "success" ? "status" : "alert"} className={`text-sm ${noticeTone === "success" ? "text-success" : "text-ink"}`}>
                    {notice}
                  </p>
                ) : null}
              </DetailBlock>
            </div>
          </div>
          <ShipmentTimeline timeline={shipment.timeline} />
          <ClaimConfirm
            open={confirming}
            pending={pending}
            cargo={shipment.cargoDescription}
            route={`${shipment.pickupLocation} → ${shipment.deliveryLocation}`}
            price={money(shipment.listedPriceVnd)}
            temperature={shipment.temperatureLabel}
            onCancel={() => {
              if (!pending) setConfirming(false);
            }}
            onConfirm={() => void claim()}
          />
        </>
      ) : null}
    </section>
  );
}
