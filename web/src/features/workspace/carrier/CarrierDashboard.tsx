import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assignmentPath, paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { MarketShipmentCard } from "@/features/shipments/MarketShipmentCard";
import { money, primaryLinkClass, shipmentTone } from "@/features/workspace/format";
import { PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CarrierShipment } from "@/models/publishedShipment";
import { listCarrierShipments, listClaimedShipments } from "@/services/shipmentService";

export function CarrierDashboard() {
  usePageTitle("Tổng quan nhà xe");
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [available, setAvailable] = useState<CarrierShipment[]>([]);
  const [claimed, setClaimed] = useState<CarrierShipment[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    Promise.all([listCarrierShipments(), listClaimedShipments()])
      .then(([open, mine]) => {
        if (!active) return;
        setAvailable(open.shipments);
        setClaimed(mine.shipments);
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

  const waiting = claimed.filter((item) => item.status === "MATCHED" && (item.vehicleId === null || item.driverId === null));
  const awaitingPickup = claimed.filter((item) => item.status === "MATCHED" && item.vehicleId !== null && item.driverId !== null);
  const later = claimed.filter((item) => item.status !== "MATCHED");
  const ordered = [...waiting, ...awaitingPickup, ...later];
  const current = claimed.find((item) => item.status === "IN_TRANSIT") ?? awaitingPickup[0];

  return (
    <section className="space-y-6">
      <PageHeader title="Sàn vận tải lạnh" summary="Đơn lạnh đang niêm yết. Nhà xe tự tìm, tự nhận, rồi tự phân công xe và tài xế." />
      <form
        className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          const q = search.trim();
          navigate(q ? `${paths.carrierFind}?q=${encodeURIComponent(q)}` : paths.carrierFind);
        }}
      >
        <Label htmlFor="carrier-home-search">Tìm chuyến theo hàng hoặc tuyến</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input id="carrier-home-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hàng hóa, điểm lấy, điểm giao" className="min-h-12" />
          <Button type="submit" className="sm:min-w-36">
            Tìm chuyến
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Nhóm nhiệt trên sàn">
        <TemperatureLink value="" label="Tất cả nhóm nhiệt" />
        <TemperatureLink value="COOL" label="Lạnh mát" />
        <TemperatureLink value="FROZEN" label="Đông" />
        <TemperatureLink value="DEEP_FROZEN" label="Cực lạnh" />
      </div>
      {state === "loading" ? <p className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-muted">Đang tải chuyến.</p> : null}
      {state === "error" ? (
        <p role="alert" className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-ink">
          Không tải được chuyến. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" ? (
        <>
          <section className="space-y-3" aria-labelledby="open-shipments-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="open-shipments-title" className="text-base font-bold text-ink">
                  Đơn đang mở
                </h2>
                <p className="mt-1 text-sm text-muted">{available.length} đơn đang tìm xe trong lần tải này.</p>
              </div>
              <Link to={paths.carrierFind} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
                Mở sàn tìm chuyến
              </Link>
            </div>
            {available.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-4 text-sm leading-relaxed text-muted">
                Không có đơn đang tìm xe. Khi chủ hàng niêm yết đơn mới, đơn sẽ hiện trên sàn.
              </p>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {available.slice(0, 3).map((shipment) => (
                  <li key={shipment.id}>
                    <MarketShipmentCard shipment={shipment} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          {current ? (
            <section className="rounded-2xl border border-line bg-surface px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy">Chuyến đang theo dõi</p>
              <h2 className="mt-2 text-xl font-extrabold leading-snug text-ink">
                {current.pickupLocation} → {current.deliveryLocation}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge tone={shipmentTone(current.status, current.vehicleId, current.driverId)}>{current.statusLabel}</StatusBadge>
                <Link to={`${paths.carrierHome}/chuyen/${current.id}`} className={primaryLinkClass}>
                  Mở chuyến
                </Link>
              </div>
            </section>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-ink">Chuyến đã nhận</h2>
                <p className="mt-1 text-sm text-muted">
                  {claimed.length} chuyến đã nhận, {waiting.length} chờ phân công, {awaitingPickup.length} đã phân công và chờ lấy hàng.
                </p>
              </div>
              <Link to={paths.carrierTrips} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
                Chuyến của tôi
              </Link>
            </div>
            {ordered.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Chưa nhận chuyến nào.</p> : null}
            <ul>
              {ordered.slice(0, 5).map((shipment) => (
                <li key={shipment.id} className="border-b border-line last:border-b-0">
                  <TripRow shipment={shipment} action={shipment.vehicleId === null || shipment.driverId === null ? "Phân công" : "Xem"} />
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}

function TemperatureLink({ value, label }: { value: string; label: string }) {
  const href = value ? `${paths.carrierFind}?temperature=${value}` : paths.carrierFind;
  return (
    <Link to={href} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-navy">
      {label}
    </Link>
  );
}

function TripRow({ shipment, action }: { shipment: CarrierShipment; action: string }) {
  const needsAssignment = shipment.vehicleId === null || shipment.driverId === null;
  const href = needsAssignment && shipment.status !== "PUBLISHED" ? assignmentPath(shipment.id) : `${paths.carrierHome}/chuyen/${shipment.id}`;
  return (
    <div className="grid items-center gap-3 px-5 py-4 lg:grid-cols-[max-content_minmax(0,1.3fr)_minmax(0,1fr)_auto_auto]">
      <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
      <p className="font-semibold text-ink">
        {shipment.pickupLocation} → {shipment.deliveryLocation}
      </p>
      <p className="text-sm text-muted">
        {shipment.cargoDescription} · {shipment.temperatureLabel}
        {shipment.cargoWeightTon === null ? "" : ` · ${shipment.cargoWeightTon} tấn`}
      </p>
      <p className="text-sm font-semibold text-ink">{money(shipment.listedPriceVnd)}</p>
      <Link to={href} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        {action}
      </Link>
    </div>
  );
}
