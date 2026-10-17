import { ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { money, shipmentTone, windowText } from "@/features/workspace/format";
import { StatusBadge } from "@/features/workspace/ui";
import type { CarrierShipment } from "@/models/publishedShipment";

const chipClass = "inline-flex min-h-8 items-center rounded-full border border-line bg-canvas px-3 text-xs font-semibold text-ink";

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
  const weight = shipment.cargoWeightTon === null ? "Chưa có tải trọng" : `${shipment.cargoWeightTon} tấn`;
  const detail = `${paths.carrierHome}/chuyen/${shipment.id}`;
  const pickupParty = shipment.pickupCompany?.trim() || "Chưa ghi đơn vị lấy hàng";
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm ${selected ? "border-navy ring-2 ring-navy" : "border-line"}`}>
      <div className="flex min-h-28 flex-col items-center justify-center gap-2 bg-line/70 px-4 py-5 text-center text-sm text-muted">
        <ImageOff className="size-5" aria-hidden="true" />
        <p>Chủ hàng chưa gửi ảnh hàng hóa</p>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
          {onCompare ? (
            <Button type="button" variant={selected ? "default" : "outline"} aria-pressed={selected} className="min-h-11 shrink-0 px-3" onClick={onCompare}>
              {selected ? "Đang so sánh" : "So sánh"}
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{shipment.cargoDescription}</p>
        <h2 className="mt-1 text-lg font-extrabold leading-snug text-ink">
          <Link to={detail} className="rounded-sm hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
            {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
          </Link>
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          <li className={chipClass}>{shipment.temperatureLabel}</li>
          <li className={chipClass}>{weight}</li>
          <li className={chipClass}>{shipment.vehicleRequirement}</li>
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted">Giờ bốc hàng</p>
            <p className="mt-1 text-sm text-ink">{windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted">Giá cước niêm yết</p>
            <p className="mt-1 text-lg font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="min-w-0 text-sm text-muted">Lấy tại {pickupParty}</p>
          {onClaim ? (
            <Button type="button" disabled={pending} onClick={onClaim}>
              Nhận chuyến
            </Button>
          ) : (
            <Link to={detail} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">
              Xem đơn
            </Link>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3">
          {onClaim ? (
            <Link to={detail} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
              Xem chi tiết
            </Link>
          ) : null}
          {shipment.pickupPhone ? (
            <a href={`tel:${shipment.pickupPhone}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
              Gọi
            </a>
          ) : null}
          <Link to={`${detail}#tro-chuyen`} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Nhắn chủ hàng
          </Link>
        </div>
      </div>
    </article>
  );
}
