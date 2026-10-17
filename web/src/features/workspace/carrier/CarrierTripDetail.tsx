import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { assignmentPath, paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, primaryLinkClass, progressNote, shipmentTone, windowText } from "@/features/workspace/format";
import { DetailBlock, FactLine, PageHeader, StatusBadge } from "@/features/workspace/ui";
import type { CarrierShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { claimShipment, listCarrierShipments, listClaimedShipments } from "@/services/shipmentService";

export function CarrierTripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [shipment, setShipment] = useState<CarrierShipment | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([listCarrierShipments(), listClaimedShipments()])
      .then(([open, mine]) => {
        if (!active) return;
        const found = mine.shipments.find((item) => item.id === id) ?? open.shipments.find((item) => item.id === id) ?? null;
        setShipment(found);
        setState(found ? "ready" : "missing");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState("error");
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
      await claimShipment(shipment.id);
      navigate(paths.carrierTrips, { replace: true });
    } catch (error) {
      if (lostSession(error, logout)) return;
      setNotice(error instanceof ApiError && error.status === 409 ? "Đơn này đã có nhà xe khác nhận. Chuyến không còn mở." : "Không nhận được chuyến. Hãy thử lại.");
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
          <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
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
                {open ? <p className="text-sm text-muted">Gọi điện không giữ chỗ và không nhận chuyến.</p> : null}
              </DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock title="Cước niêm yết">
                <p className="text-2xl font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
              </DetailBlock>
              <DetailBlock title={open ? "Nhận chuyến" : "Phân công"}>
                {open ? (
                  <>
                    <p className="text-sm leading-relaxed text-ink">Nhận chuyến chưa gán xe hay tài xế. Chỉ một nhà xe nhận được.</p>
                    <Button type="button" disabled={pending} onClick={() => void claim()}>
                      {pending ? "Đang nhận chuyến" : "Nhận chuyến"}
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
                  <p role="alert" className="text-sm text-ink">
                    {notice}
                  </p>
                ) : null}
              </DetailBlock>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
