import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, shipmentTone, windowText } from "@/features/workspace/format";
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
  }, [id, logout]);

  async function confirm() {
    if (!shipment || pendingRef.current || shipment.nextAction === "none") return;
    pendingRef.current = true;
    setPending(true);
    setNotice(null);
    try {
      const body = shipment.nextAction === "pickup" ? await confirmDriverPickup(shipment.id) : await confirmDriverDelivery(shipment.id);
      setShipment(body.shipment);
      setConfirming(null);
      setNotice(body.shipment.status === "DELIVERY_CONFIRMED" ? "Đã xác nhận giao hàng. Việc này chưa phải thanh toán." : "Đã xác nhận lấy hàng. Chuyến đang vận chuyển.");
    } catch (error) {
      if (lostSession(error, logout)) return;
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

  return (
    <section className="space-y-6">
      <Link to={paths.driverTrips} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Chuyến của tôi
      </Link>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy chuyến này trong các chuyến được phân công.</p> : null}
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
            <div className="space-y-4">
              <DetailBlock title="Cước niêm yết">
                <p className="text-2xl font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
                <p className="text-sm text-muted">Giá chủ hàng niêm yết. Xác nhận giao hàng chưa phải thanh toán.</p>
              </DetailBlock>
              <DetailBlock title="Xác nhận">
                <FactLine term="Lấy hàng" value={shipment.pickupConfirmedAt ? "Đã xác nhận" : "Chưa xác nhận"} />
                <FactLine term="Giao hàng" value={shipment.deliveryConfirmedAt ? "Đã xác nhận" : "Chưa xác nhận"} />
                {shipment.nextAction === "none" ? <p className="text-sm leading-relaxed text-ink">Chuyến đã xác nhận giao hàng. Không còn thao tác xác nhận.</p> : null}
                {shipment.nextAction !== "none" && confirming !== shipment.nextAction ? (
                  <Button type="button" onClick={() => setConfirming(shipment.nextAction === "none" ? null : shipment.nextAction)}>
                    {shipment.nextAction === "pickup" ? "Xác nhận đã lấy hàng" : "Xác nhận đã giao hàng"}
                  </Button>
                ) : null}
                {confirming ? (
                  <div className="rounded-xl border border-warning-line bg-warning-bg p-4">
                    <p className="text-sm leading-relaxed text-ink">
                      {confirming === "pickup"
                        ? "Xác nhận đã lấy hàng tại điểm lấy. Chuyến chuyển sang Đang vận chuyển. Thao tác này không phải thanh toán."
                        : "Xác nhận đã giao hàng tại điểm giao. Trạng thái thành Đã xác nhận giao hàng, chưa phải đã thanh toán."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" disabled={pending} onClick={() => void confirm()}>
                        {pending ? "Đang ghi nhận" : "Ghi nhận xác nhận"}
                      </Button>
                      <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirming(null)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : null}
                {notice ? (
                  <p role="status" className="text-sm text-ink">
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
