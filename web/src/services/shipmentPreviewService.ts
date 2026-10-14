import { illustrativeShipment } from "@/data/illustrativeShipment";
import type { ShipmentPreview } from "@/models/shipment";

/**
 * Order listing/create endpoints are still TBD.
 * This returns the design illustration only.
 */
export function getIllustrativeShipmentPreview(): ShipmentPreview {
  return illustrativeShipment;
}
