import { Snowflake, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { money, shipmentTone, windowText } from "@/features/workspace/format";
import { StatusBadge } from "@/features/workspace/ui";
import type { PublishedShipment } from "@/models/publishedShipment";

const chipClass = "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-canvas px-3 text-xs font-semibold text-ink";

export function ShipperShipmentCard({ shipment }: { shipment: PublishedShipment }) {
  const detail = `${paths.shipperShipments}/${shipment.id}`;
  const weight = shipment.cargoWeightTon === null ? "Chưa có tải trọng" : `${shipment.cargoWeightTon} tấn`;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
      <h2 className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-ink">
        <Link to={detail} className="rounded-sm hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
        </Link>
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{shipment.cargoDescription}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li className={chipClass}>
          <Snowflake className="size-3.5 text-navy" aria-hidden="true" />
          {shipment.temperatureLabel}
        </li>
        <li className={chipClass}>{weight}</li>
        <li className={chipClass}>
          <Truck className="size-3.5 text-navy" aria-hidden="true" />
          {shipment.vehicleRequirement}
        </li>
      </ul>
      <p className="mt-3 text-sm text-ink">
        <span className="text-muted">Lấy hàng </span>
        {windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}
      </p>
      <div className="mt-auto border-t border-line pt-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Giá cước niêm yết</p>
            <p className="mt-1 text-xl font-extrabold whitespace-nowrap text-navy">{money(shipment.listedPriceVnd)}</p>
          </div>
          <Link to={detail} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">
            Xem đơn
          </Link>
        </div>
        {shipment.status === "IN_TRANSIT" ? (
          <Link to={`${detail}#vi-tri`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Xem vị trí
          </Link>
        ) : null}
        {shipment.status === "DELIVERY_CONFIRMED" ? (
          <Link to={`${detail}#vi-tri`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Xem thông tin vị trí
          </Link>
        ) : null}
      </div>
    </article>
  );
}
