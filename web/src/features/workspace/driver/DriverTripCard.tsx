import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { shipmentTone, windowText } from "@/features/workspace/format";
import { driverActionLabel, driverLane, driverLaneLabel } from "@/features/workspace/driver/driverLanes";
import { StatusBadge } from "@/features/workspace/ui";
import type { DriverShipment } from "@/models/publishedShipment";

const chipClass = "inline-flex min-h-8 items-center rounded-full border border-line bg-canvas px-3 text-xs font-semibold text-ink";

export function DriverTripCard({ shipment }: { shipment: DriverShipment }) {
  const detail = `${paths.driverTrips}/${shipment.id}`;
  const href = shipment.nextAction === "none" ? detail : `${detail}#xac-nhan`;
  const weight = shipment.cargoWeightTon === null ? "Chưa có tải trọng" : `${shipment.cargoWeightTon} tấn`;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
        <p className="text-xs font-semibold text-muted">{driverLaneLabel(driverLane(shipment.status))}</p>
      </div>
      <h2 className="mt-3 text-lg font-extrabold leading-snug text-ink">
        <Link to={href} className="rounded-sm hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          {shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}
        </Link>
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{shipment.cargoDescription}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li className={chipClass}>{shipment.temperatureLabel}</li>
        <li className={chipClass}>{weight}</li>
        <li className={chipClass}>{shipment.vehicleRequirement}</li>
      </ul>
      <dl className="mt-3 space-y-1 text-sm text-ink">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Lấy hàng</dt>
          <dd>{windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Giao hàng</dt>
          <dd>{windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Xe</dt>
          <dd>{shipment.vehicleLabel ?? "Xe đã phân công"}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm font-semibold text-ink">Việc tiếp theo: {driverActionLabel(shipment.nextAction)}</p>
      <Link to={href} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">
        Xem chi tiết chuyến
      </Link>
    </article>
  );
}
