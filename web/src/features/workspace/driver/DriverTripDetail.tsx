import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { driverActionLabel, driverLane, driverLaneLabel } from "@/features/workspace/driver/driverLanes";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, shipmentTone, windowText } from "@/features/workspace/format";
import { DriverLocationShare } from "@/features/workspace/gps/DriverLocationShare";
import { ShipmentTimeline } from "@/features/workspace/ShipmentTimeline";
import { DetailBlock, FactLine, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { DriverShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { confirmDriverDelivery, confirmDriverPickup, getDriverShipment } from "@/services/shipmentService";

export function DriverTripDetail() {
  usePageTitle("Chi tiết chuyến");
  const { id } = useParams();
  const { logout } = useAuth();
  const [shipment, setShipment] = useState<DriverShipment | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [confirming, setConfirming] = useState<"pickup" | "delivery" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getDriverShipment(id)
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
  }, [id, logout, reloadKey]);

  async function confirm() {
    if (!shipment || pendingRef.current || shipment.nextAction === "none") return;
    pendingRef.current = true;
    setPending(true);
    setNotice(null);
    try {
      const body = shipment.nextAction === "pickup" ? await confirmDriverPickup(shipment.id) : await confirmDriverDelivery(shipment.id);
      setShipment(body.shipment);
      setConfirming(null);
      setNoticeTone("ok");
      setNotice(body.shipment.status === "DELIVERY_CONFIRMED" ? "Đã xác nhận giao hàng. Việc này chưa phải thanh toán." : "Đã xác nhận lấy hàng. Chuyến đang vận chuyển.");
    } catch (error) {
      if (lostSession(error, logout)) return;
      setNoticeTone("error");
      setNotice(error instanceof ApiError ? error.message : "Không ghi nhận được xác nhận. Hãy tải lại chuyến.");
      if (id) {
        const fresh = await getDriverShipment(id).catch(() => null);
        if (fresh) setShipment(fresh.shipment);
      }
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  const phase = shipment?.status === "IN_TRANSIT" ? "transit" : shipment?.status === "DELIVERY_CONFIRMED" ? "delivered" : "waiting";

  return (
    <section className="space-y-6">
      <Link to={paths.driverTrips} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Chuyến của tôi
      </Link>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy chuyến này trong các chuyến được phân công.</p> : null}
      {state === "error" ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-ink">Không tải được chuyến.</p>
          <Button type="button" className="mt-3" variant="outline" onClick={() => {
            setState("loading");
            setReloadKey((value) => value + 1);
          }}>
            Thử lại
          </Button>
        </div>
      ) : null}
      {state === "ready" && shipment ? (
        <>
          <PageHeader title={`${shipment.pickupLocation} → ${shipment.deliveryLocation}`} summary={shipment.cargoDescription} />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
            <p className="text-sm font-semibold text-muted">{driverLaneLabel(driverLane(shipment.status))}</p>
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
            <div className="order-2 space-y-4 lg:order-1">
              <DetailBlock title="Lộ trình">
                <FactLine term="Điểm lấy" value={[shipment.pickupCompany, shipment.pickupLocation].filter(Boolean).join(" — ")} />
                <FactLine term="Lịch lấy" value={windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)} />
                <FactLine term="Liên hệ lấy" value={[shipment.pickupContactName, shipment.pickupPhone].filter(Boolean).join(" · ") || "Chưa có"} />
                <FactLine term="Điểm giao" value={[shipment.deliveryCompany, shipment.deliveryLocation].filter(Boolean).join(" — ")} />
                <FactLine term="Lịch giao" value={windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)} />
                <FactLine term="Liên hệ giao" value={[shipment.deliveryContactName, shipment.deliveryPhone].filter(Boolean).join(" · ") || "Chưa có"} />
              </DetailBlock>
              <DetailBlock title="Hàng hóa">
                <FactLine term="Mô tả" value={shipment.cargoDescription} />
                <FactLine term="Nhóm nhiệt" value={shipment.temperatureLabel} />
                <FactLine term="Khối lượng" value={`${shipment.cargoWeightTon ?? "Chưa có"} tấn · ${shipment.cargoVolumeM3 ?? "Chưa có"} m³ · ${shipment.packageCount ?? "Chưa có"} thùng`} />
                <FactLine term="Yêu cầu xe" value={shipment.vehicleRequirement} />
                <FactLine term="Xe được gán" value={shipment.vehicleLabel ?? "Xe đã phân công"} />
              </DetailBlock>
            </div>
            <div className="order-1 space-y-4 lg:order-2">
              <DetailBlock title="Cước niêm yết">
                <p className="text-2xl font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
                <p className="text-sm text-muted">Giá chủ hàng niêm yết. Xác nhận giao hàng chưa phải thanh toán.</p>
              </DetailBlock>
              <div id="xac-nhan">
                <DetailBlock title="Xác nhận">
                  <FactLine term="Lấy hàng" value={shipment.pickupConfirmedAt ? "Đã xác nhận" : "Chưa xác nhận"} />
                  <FactLine term="Giao hàng" value={shipment.deliveryConfirmedAt ? "Đã xác nhận" : "Chưa xác nhận"} />
                  <p className="text-sm font-semibold text-ink">Việc tiếp theo: {driverActionLabel(shipment.nextAction)}</p>
                  {shipment.nextAction === "none" ? <p className="text-sm leading-relaxed text-ink">Chuyến đã xác nhận giao hàng. Không còn thao tác xác nhận và không tự chuyển sang hoàn tất.</p> : null}
                  {shipment.nextAction !== "none" && confirming !== shipment.nextAction ? (
                    <Button type="button" className="min-h-11 w-full" disabled={pending} onClick={() => setConfirming(shipment.nextAction === "none" ? null : shipment.nextAction)}>
                      {shipment.nextAction === "pickup" ? "Xác nhận đã lấy hàng" : "Xác nhận đã giao hàng"}
                    </Button>
                  ) : null}
                  {confirming ? (
                    <div className="rounded-xl border border-warning-line bg-warning-bg p-4" aria-busy={pending} aria-labelledby="driver-confirm-title">
                      <h3 id="driver-confirm-title" className="text-base font-bold text-ink">
                        {confirming === "pickup" ? "Ghi nhận đã lấy hàng?" : "Ghi nhận đã giao hàng?"}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink">
                        {confirming === "pickup"
                          ? "Chuyến chuyển sang Đang vận chuyển và ghi mốc đã lấy hàng. Thao tác này không phải thanh toán và không lấy từ GPS."
                          : "Trạng thái thành Đã xác nhận giao hàng và ghi mốc đã giao. Chưa phải đã thanh toán. GPS không tự xác nhận giao."}
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Button type="button" className="min-h-11 w-full sm:w-auto" disabled={pending} onClick={() => void confirm()}>
                          {pending ? "Đang ghi nhận" : "Ghi nhận xác nhận"}
                        </Button>
                        <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" disabled={pending} onClick={() => setConfirming(null)}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {notice ? (
                    <p role={noticeTone === "error" ? "alert" : "status"} className={noticeTone === "error" ? "text-sm text-danger" : "text-sm text-ink"}>
                      {notice}
                    </p>
                  ) : null}
                </DetailBlock>
              </div>
            </div>
          </div>
          <DriverLocationShare shipmentId={shipment.id} active={shipment.status === "IN_TRANSIT"} phase={phase} />
          <p className="text-sm leading-relaxed text-muted">Năm mốc: đăng đơn, nhà xe nhận, phân công, lấy hàng, giao hàng. GPS không tạo mốc. Tên trên mốc phân công là tên đã lưu lúc gán.</p>
          <ShipmentTimeline timeline={shipment.timeline} />
        </>
      ) : null}
    </section>
  );
}
