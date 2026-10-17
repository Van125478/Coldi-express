import { Snowflake, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { shipmentTone, windowText } from "@/features/workspace/format";
import { driverActionLabel } from "@/features/workspace/driver/driverLanes";
import { StatusBadge } from "@/features/workspace/ui";
import type { DriverShipment } from "@/models/publishedShipment";

const chipClass = "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-ink";

export function DriverTripCard({ shipment }: { shipment: DriverShipment }) {
  const detail = `${paths.driverTrips}/${shipment.id}`;
  const href = shipment.nextAction === "none" ? detail : `${detail}#xac-nhan`;
  const weight = shipment.cargoWeightTon === null ? "Chưa có tải trọng" : `${shipment.cargoWeightTon} tấn`;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
      <h2 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink">
        <Link to={href} className="rounded-sm hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
        </Link>
      </h2>
      <div className="mt-4 rounded-xl bg-canvas px-4 py-3">
        <p className="text-sm font-semibold leading-relaxed text-ink">{shipment.cargoDescription}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          <li className={chipClass}>
            <Snowflake className="size-3.5 text-navy" aria-hidden="true" />
            {shipment.temperatureLabel} · {weight}
          </li>
          <li className={chipClass}>
            <Truck className="size-3.5 text-navy" aria-hidden="true" />
            {shipment.vehicleLabel ?? shipment.vehicleRequirement}
          </li>
        </ul>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink">
        <span className="text-muted">Lấy hàng </span>
        {windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink">
        <span className="text-muted">Giao hàng </span>
        {windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)}
      </p>
      <p className="mt-3 text-sm font-semibold text-ink">Việc tiếp theo: {driverActionLabel(shipment.nextAction)}</p>
      <Link to={href} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">
        Xem chi tiết chuyến
      </Link>
    </article>
  );
}
