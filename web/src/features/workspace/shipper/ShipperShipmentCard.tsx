import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { money, shipmentTone, windowText } from "@/features/workspace/format";
import { StatusBadge } from "@/features/workspace/ui";
import type { PublishedShipment } from "@/models/publishedShipment";

const chipClass = "inline-flex min-h-8 items-center rounded-full border border-line bg-canvas px-3 text-xs font-semibold text-ink";

export function ShipperShipmentCard({ shipment }: { shipment: PublishedShipment }) {
  const detail = `${paths.shipperShipments}/${shipment.id}`;
  const weight = shipment.cargoWeightTon === null ? "Chưa có tải trọng" : `${shipment.cargoWeightTon} tấn`;
  const trackable = shipment.status === "IN_TRANSIT" || shipment.status === "DELIVERY_CONFIRMED";
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
      <h2 className="mt-3 text-lg font-extrabold leading-snug text-ink">
        <Link to={detail} className="rounded-sm hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
        </Link>
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{shipment.cargoDescription}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li className={chipClass}>{shipment.temperatureLabel}</li>
        <li className={chipClass}>{weight}</li>
        <li className={chipClass}>{shipment.vehicleRequirement}</li>
      </ul>
      <p className="mt-3 text-sm text-muted">Lấy hàng: {windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted">Giá cước niêm yết</p>
          <p className="mt-1 text-lg font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
        </div>
        <Link to={detail} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">
          Xem đơn
        </Link>
      </div>
      {trackable ? (
        <Link to={`${detail}#vi-tri`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
          Xem vị trí
        </Link>
      ) : null}
    </article>
  );
}
