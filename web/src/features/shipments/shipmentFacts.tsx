import type { CarrierShipment } from "@/models/publishedShipment";

function civil(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function windowText(date: string | null, from: string | null, to: string | null): string | null {
  if (!date || !from || !to) return null;
  return `${civil(date)}, ${from}–${to}`;
}

export function ShipmentFacts({ shipment }: { shipment: CarrierShipment }) {
  const pickupWindow = windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo);
  const deliveryWindow = windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo);
  const measures = [
    shipment.cargoWeightTon === null ? null : `${shipment.cargoWeightTon} tấn`,
    shipment.cargoVolumeM3 === null ? null : `${shipment.cargoVolumeM3} m³`,
    shipment.packageCount === null ? null : `${shipment.packageCount} thùng`,
  ].filter((item) => item !== null);

  return (
    <>
      <p className="mt-3 text-sm text-muted">
        {[shipment.pickupCompany, shipment.pickupLocation].filter(Boolean).join(" — ")} →{" "}
        {[shipment.deliveryCompany, shipment.deliveryLocation].filter(Boolean).join(" — ")}
      </p>
      <p className="mt-1 text-sm text-muted">
        {shipment.temperatureLabel}
        {measures.length > 0 ? ` · ${measures.join(" · ")}` : ""} · {shipment.vehicleRequirement} ·{" "}
        {`${new Intl.NumberFormat("vi-VN").format(shipment.listedPriceVnd)} đ`}
      </p>
      {pickupWindow ? <p className="mt-1 text-sm text-muted">Lấy hàng: {pickupWindow}</p> : null}
      {deliveryWindow ? <p className="mt-1 text-sm text-muted">Giao muộn nhất: {deliveryWindow}</p> : null}
      {shipment.pickupPhone ? (
        <p className="mt-1 text-sm text-muted">
          Liên hệ lấy: {[shipment.pickupContactName, shipment.pickupPhone].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {shipment.deliveryPhone ? (
        <p className="mt-1 text-sm text-muted">
          Liên hệ giao: {[shipment.deliveryContactName, shipment.deliveryPhone].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </>
  );
}
