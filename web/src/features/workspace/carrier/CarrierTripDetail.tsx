import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assignmentPath, paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { ClaimConfirm } from "@/features/shipments/ClaimConfirm";
import { lostSession } from "@/features/workspace/sessionLoss";
import { assignedDriverLine, cargoMeasures, stopFacts } from "@/features/workspace/carrier/carrierCopy";
import { money, primaryLinkClass, progressNote, shipmentTone, windowText } from "@/features/workspace/format";
import { CarrierChat } from "@/features/workspace/chat/CarrierChat";
import { ShipmentTimeline } from "@/features/workspace/ShipmentTimeline";
import { DetailBlock, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { claimShipment, getCarrierShipment } from "@/services/shipmentService";

function Stop({ label, place, schedule, contactValue }: { label: string; place: string; schedule: string; contactValue: string }) {
  const facts = stopFacts(schedule, contactValue);
  return (
    <div className="rounded-xl bg-canvas px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy">{label}</p>
      <p className="mt-1 text-base font-bold leading-snug text-ink">{place}</p>
      {facts.schedule ? (
        <p className="mt-2 text-sm leading-relaxed text-ink">
          <span className="text-muted">Lịch </span>
          {facts.schedule}
        </p>
      ) : null}
      {facts.contact ? (
        <p className="mt-1 text-sm leading-relaxed text-ink">
          <span className="text-muted">Liên hệ </span>
          {facts.contact}
        </p>
      ) : null}
      {facts.gap ? <p className="mt-2 text-sm leading-relaxed text-muted">{facts.gap}</p> : null}
    </div>
  );
}

function party(company: string | null, location: string): string {
  const name = company?.trim();
  return name ? `${name} — ${location}` : location;
}

function contact(name: string | null, phone: string | null): string {
  const value = [name, phone].filter(Boolean).join(" · ");
  return value.length > 0 ? value : "Chưa có";
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <PageHeader title={`${shipment.pickupLocation} → ${shipment.deliveryLocation}`} />
            <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.72fr)]">
            <div className="space-y-4">
              <DetailBlock title="Lấy hàng và giao hàng">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stop
                    label="Điểm lấy hàng"
                    place={party(shipment.pickupCompany, shipment.pickupLocation)}
                    schedule={windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}
                    contactValue={contact(shipment.pickupContactName, shipment.pickupPhone)}
                  />
                  <Stop
                    label="Điểm giao hàng"
                    place={party(shipment.deliveryCompany, shipment.deliveryLocation)}
                    schedule={windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)}
                    contactValue={contact(shipment.deliveryContactName, shipment.deliveryPhone)}
                  />
                </div>
                {shipment.pickupPhone ? (
                  <a href={`tel:${shipment.pickupPhone}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
                    Gọi điểm lấy
                  </a>
                ) : null}
                {open ? <p className="text-sm text-muted">Gọi điện hoặc nhắn tin không giữ chỗ và không nhận chuyến.</p> : null}
              </DetailBlock>
              <DetailBlock title="Hàng hóa">
                <p className="text-lg font-bold leading-snug text-ink">{shipment.cargoDescription}</p>
                <p className="text-sm leading-relaxed text-ink">{shipment.temperatureLabel}</p>
                <p className="text-sm leading-relaxed text-ink">{cargoMeasures(shipment.cargoWeightTon, shipment.cargoVolumeM3, shipment.packageCount)}</p>
                <p className="text-sm leading-relaxed text-ink">
                  <span className="text-muted">Yêu cầu xe </span>
                  {shipment.vehicleRequirement}
                </p>
              </DetailBlock>
              <div id="tro-chuyen">
                <CarrierChat shipmentId={shipment.id} />
              </div>
              <ShipmentTimeline timeline={shipment.timeline} technical={false} />
            </div>
            <div className="space-y-4">
              <DetailBlock title="Cước niêm yết">
                <p className="text-3xl font-extrabold tracking-tight text-navy">{money(shipment.listedPriceVnd)}</p>
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
                    <p className="text-sm leading-relaxed text-ink">Đã nhận chuyến. Chưa có xe và tài xế.</p>
                    <Link to={assignmentPath(shipment.id)} className={primaryLinkClass}>
                      Phân công xe và tài xế
                    </Link>
                  </>
                ) : null}
                {shipment.vehicleId !== null && shipment.driverId !== null ? (
                  <>
                    <p className="text-base font-bold leading-snug text-ink">{shipment.vehicleLabel ?? "Xe đã phân công"}</p>
                    <p className="text-sm leading-relaxed text-ink">{assignedDriverLine(shipment.driverName)}</p>
                    <p className="text-sm text-muted">{progressNote(shipment.status)}</p>
                  </>
                ) : null}
                {notice ? (
                  <p role={noticeTone === "success" ? "status" : "alert"} className={`text-sm ${noticeTone === "success" ? "text-success" : "text-ink"}`}>
                    {notice}
                  </p>
                ) : null}
              </DetailBlock>
              <DetailBlock title="Bản đồ lộ trình">
                <p className="text-sm leading-relaxed text-ink">Chưa có bản đồ tuyến. Địa chỉ lấy hàng và giao hàng chưa gắn được vị trí.</p>
              </DetailBlock>
            </div>
          </div>
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
