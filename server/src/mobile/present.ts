import { temperatureLabels, type ShipmentStatus, type TemperatureGroup } from "../models/shipment.js";
import { shipmentStatusLabel } from "../shipments/shipmentDto.js";

export type MobileShipmentCard = {
  id: string;
  cargoDescription: string;
  pickupLocation: string;
  pickupContactName: string | null;
  pickupPhone: string | null;
  pickupDate: string | null;
  pickupTimeFrom: string | null;
  pickupTimeTo: string | null;
  deliveryLocation: string;
  deliveryContactName: string | null;
  deliveryPhone: string | null;
  deliveryDate: string | null;
  deliveryTimeFrom: string | null;
  deliveryTimeTo: string | null;
  temperatureGroup: TemperatureGroup;
  temperatureLabel: string;
  deepFrozen: boolean;
  listedPriceVnd: number;
  cargoImages: { id: string }[];
  status: ShipmentStatus;
  statusLabel: string;
  createdAt: string;
};

export type ReviewGroup = { stars: number; count: number };

export type MobileReview = {
  id: string;
  stars: number;
  comment: string;
  createdAt: string;
};

type CardSource = {
  _id: { toString(): string };
  cargoDescription: string;
  pickupLocation: string;
  pickupContactName?: string | null;
  pickupPhone?: string | null;
  pickupDate?: string | null;
  pickupTimeFrom?: string | null;
  pickupTimeTo?: string | null;
  deliveryLocation: string;
  deliveryContactName?: string | null;
  deliveryPhone?: string | null;
  deliveryDate?: string | null;
  deliveryTimeFrom?: string | null;
  deliveryTimeTo?: string | null;
  temperatureGroup: TemperatureGroup;
  listedPriceVnd: number;
  cargoImageIds?: { toString(): string }[] | null;
  status: ShipmentStatus;
  vehicleId?: { toString(): string } | null;
  driverId?: { toString(): string } | null;
  createdAt: Date;
};

function textOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function toMobileShipmentCard(shipment: CardSource): MobileShipmentCard {
  const assigned = Boolean(shipment.vehicleId && shipment.driverId);
  return {
    id: shipment._id.toString(),
    cargoDescription: shipment.cargoDescription,
    pickupLocation: shipment.pickupLocation,
    pickupContactName: textOrNull(shipment.pickupContactName),
    pickupPhone: textOrNull(shipment.pickupPhone),
    pickupDate: textOrNull(shipment.pickupDate),
    pickupTimeFrom: textOrNull(shipment.pickupTimeFrom),
    pickupTimeTo: textOrNull(shipment.pickupTimeTo),
    deliveryLocation: shipment.deliveryLocation,
    deliveryContactName: textOrNull(shipment.deliveryContactName),
    deliveryPhone: textOrNull(shipment.deliveryPhone),
    deliveryDate: textOrNull(shipment.deliveryDate),
    deliveryTimeFrom: textOrNull(shipment.deliveryTimeFrom),
    deliveryTimeTo: textOrNull(shipment.deliveryTimeTo),
    temperatureGroup: shipment.temperatureGroup,
    temperatureLabel: temperatureLabels[shipment.temperatureGroup],
    deepFrozen: shipment.temperatureGroup === "DEEP_FROZEN",
    listedPriceVnd: shipment.listedPriceVnd,
    cargoImages: (shipment.cargoImageIds ?? []).map((id) => ({ id: id.toString() })),
    status: shipment.status,
    statusLabel: shipmentStatusLabel(shipment.status, assigned),
    createdAt: shipment.createdAt.toISOString(),
  };
}

export function toMobileReview(review: { _id: { toString(): string }; stars: number; comment: string; createdAt: Date }): MobileReview {
  return {
    id: review._id.toString(),
    stars: review.stars,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

export function groupReviews(reviews: readonly { stars: number }[]): ReviewGroup[] {
  const counts = new Map<number, number>();
  for (const review of reviews) counts.set(review.stars, (counts.get(review.stars) ?? 0) + 1);
  return [...counts.entries()]
    .sort((left, right) => right[0] - left[0])
    .map(([stars, count]) => ({ stars, count }));
}
