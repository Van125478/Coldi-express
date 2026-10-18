import { Snowflake, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { civil, money, shipmentTone, windowText } from "@/features/workspace/format";
import { StatusBadge } from "@/features/workspace/ui";
import { CargoImageGallery } from "@/features/shipments/CargoImageGallery";
import type { CarrierShipment } from "@/models/publishedShipment";

export function MarketShipmentCard({
  shipment,
  selected = false,
  pending = false,
  onClaim,
  onCompare,
}: {
  shipment: CarrierShipment;
  selected?: boolean;
  pending?: boolean;
  onClaim?: () => void;
  onCompare?: () => void;
}) {
  const detail = `${paths.carrierHome}/chuyen/${shipment.id}`;
  const pickupParty = shipment.pickupCompany?.trim() || "Chưa ghi đơn vị lấy hàng";
  const schedule = pickupSchedule(shipment);
  const images = shipment.cargoImages ?? [];
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-surface ${selected ? "border-navy ring-2 ring-navy" : "border-line"}`}>
      {images.length > 0 ? (
        <div className="border-b border-line bg-canvas">
          <CargoImageGallery images={images} compact />
        </div>
      ) : (
        <div className="flex h-14 items-center gap-2 border-b border-line bg-canvas px-4 text-sm font-medium text-muted">
          <Snowflake className="size-4 shrink-0 text-navy/70" aria-hidden="true" />
          <span>Chưa có ảnh hàng hóa</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm font-bold text-ink" title={shipment.id}>
            <span className="sr-only">Mã đơn </span>#{shipment.id.slice(-6).toUpperCase()}
          </p>
          <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
          {onCompare ? (
            <Button type="button" variant={selected ? "default" : "outline"} aria-pressed={selected} className="ml-auto min-h-10 shrink-0 px-3" onClick={onCompare}>
              {selected ? "Đang so sánh" : "So sánh"}
            </Button>
          ) : null}
        </div>
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-ink">
          <Snowflake className="mt-0.5 size-4 shrink-0 text-navy" aria-hidden="true" />
          <span>
            {shipment.temperatureLabel}
            <span className="text-muted"> · {shipment.cargoDescription}</span>
          </span>
        </p>
        <h2 className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-ink">
          <Link to={detail} className="rounded-sm hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
            {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
          </Link>
        </h2>
        <p className="mt-3 inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-ink">
          <Truck className="size-3.5 shrink-0 text-navy" aria-hidden="true" />
          <span className="truncate">{shipment.vehicleRequirement}</span>
        </p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Giờ bốc hàng</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-ink">{schedule.date}</p>
            {schedule.time ? <p className="text-sm font-semibold leading-snug text-ink">{schedule.time}</p> : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Giá cước</p>
            <p className="mt-1 whitespace-nowrap text-lg font-extrabold leading-none text-navy min-[1440px]:text-xl">{money(shipment.listedPriceVnd)}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="min-w-0 truncate text-sm font-medium text-ink">{pickupParty}</p>
          <Link to={detail} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">
            Xem đơn
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3">
          {onClaim ? (
            <Button type="button" variant="outline" className="min-h-10" disabled={pending} onClick={onClaim}>
              Nhận chuyến
            </Button>
          ) : null}
          {shipment.pickupPhone ? (
            <a href={`tel:${shipment.pickupPhone}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
              Gọi
            </a>
          ) : null}
          <Link to={`${detail}#tro-chuyen`} className="inline-flex min-h-10 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Nhắn chủ hàng
          </Link>
        </div>
      </div>
    </article>
  );
}

function pickupSchedule(shipment: CarrierShipment): { date: string; time: string } {
  if (!shipment.pickupDate || !shipment.pickupTimeFrom || !shipment.pickupTimeTo) {
    return { date: windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo), time: "" };
  }
  return { date: civil(shipment.pickupDate), time: `${shipment.pickupTimeFrom}–${shipment.pickupTimeTo}` };
}
