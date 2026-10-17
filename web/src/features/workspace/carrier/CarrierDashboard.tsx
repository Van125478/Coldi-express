import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assignmentPath, paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { MarketShipmentCard } from "@/features/shipments/MarketShipmentCard";
import { civil, money, primaryLinkClass, shipmentTone } from "@/features/workspace/format";
import { PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import cargoStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import doorsStill from "@/features/transition-lab/keyframe-02-doors-closing.jpg";
import rearStill from "@/features/transition-lab/keyframe-03-closed-rear.jpg";
import roadStill from "@/features/transition-lab/keyframe-04-high-angle-road.jpg";
import type { CarrierShipment } from "@/models/publishedShipment";
import { listCarrierShipments, listClaimedShipments } from "@/services/shipmentService";

const tripStills = [cargoStill, doorsStill, rearStill, roadStill] as const;

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
      <PageHeader title="Tổng quan nhà xe" summary="Chuyến đang mở, chuyến đang theo dõi và chuyến đã nhận. Đơn mới nằm trên sàn tìm chuyến." />
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
          <section className="space-y-3" aria-labelledby="claimed-shipments-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="claimed-shipments-title" className="text-base font-bold text-ink">
                  Chuyến đã nhận
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {claimed.length} chuyến đã nhận, {waiting.length} chờ phân công, {awaitingPickup.length} đã phân công và chờ lấy hàng.
                </p>
              </div>
              <Link to={paths.carrierTrips} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
                Chuyến của tôi
              </Link>
            </div>
            {ordered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-surface px-5 py-4 text-sm leading-relaxed text-muted">Chưa nhận chuyến nào.</p>
            ) : (
              <ul className="grid items-stretch gap-4 md:grid-cols-2 desk:grid-cols-3">
                {ordered.slice(0, 6).map((shipment) => (
                  <li key={shipment.id} className="min-w-0">
                    <HomeTripCard shipment={shipment} />
                  </li>
                ))}
              </ul>
            )}
          </section>
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

function stillForTrip(id: string): (typeof tripStills)[number] {
  let total = 0;
  for (let index = 0; index < id.length; index += 1) total = (total + id.charCodeAt(index)) % tripStills.length;
  return tripStills[total] ?? cargoStill;
}

function HomeTripCard({ shipment }: { shipment: CarrierShipment }) {
  const needsAssignment = shipment.vehicleId === null || shipment.driverId === null;
  const href = needsAssignment && shipment.status !== "PUBLISHED" ? assignmentPath(shipment.id) : `${paths.carrierHome}/chuyen/${shipment.id}`;
  const pickup = shipment.pickupDate ? civil(shipment.pickupDate) : "Chưa cập nhật";
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#E7EDF4]" aria-hidden="true">
        <img src={stillForTrip(shipment.id)} alt="" className="h-full w-full object-cover object-center" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
          <p className="shrink-0 text-right text-sm font-extrabold whitespace-nowrap text-navy">{money(shipment.listedPriceVnd)}</p>
        </div>
        <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-ink">
          {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{shipment.cargoDescription}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          <span className="font-semibold">{shipment.temperatureLabel}</span>
          <span className="text-muted"> · {shipment.vehicleRequirement}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink">
          <span className="text-muted">Ngày lấy: </span>
          <span className="font-semibold">{pickup}</span>
        </p>
        <div className="mt-auto pt-5">
          <Link to={href} className={`${primaryLinkClass} w-full`}>
            {needsAssignment ? "Phân công" : "Xem"}
          </Link>
        </div>
      </div>
    </article>
  );
}
