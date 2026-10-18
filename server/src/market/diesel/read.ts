import { DieselPublication } from "../../models/dieselPrice.js";
import {
  dieselDisclaimer,
  dieselOfficialIndexUrl,
  dieselPriceKindLabels,
  dieselProduct,
  dieselProductLabel,
  dieselUnavailableMessage,
  dieselUnit,
  latestKnownDieselDocument,
  type DieselPriceKind,
} from "./policy.js";

export type DieselView = {
  available: boolean;
  product: typeof dieselProduct;
  productLabel: string;
  priceVndPerLitre: number | null;
  priceKind: DieselPriceKind | null;
  priceKindLabel: string | null;
  unit: typeof dieselUnit;
  documentNumber: string | null;
  sourceUrl: string | null;
  announcedOn: string | null;
  effectiveAt: string | null;
  verifiedAt: string | null;
  message: string | null;
  officialIndexUrl: string;
  latestKnownDocument: typeof latestKnownDieselDocument;
  disclaimer: string;
};

export function unpublishedDiesel(): DieselView {
  return {
    available: false,
    product: dieselProduct,
    productLabel: dieselProductLabel,
    priceVndPerLitre: null,
    priceKind: null,
    priceKindLabel: null,
    unit: dieselUnit,
    documentNumber: null,
    sourceUrl: null,
    announcedOn: null,
    effectiveAt: null,
    verifiedAt: null,
    message: dieselUnavailableMessage,
    officialIndexUrl: dieselOfficialIndexUrl,
    latestKnownDocument: latestKnownDieselDocument,
    disclaimer: dieselDisclaimer,
  };
}

export async function readDieselPrice(): Promise<DieselView> {
  const row = await DieselPublication.findOne({ product: dieselProduct, superseded: false }).sort({ verifiedAt: -1, _id: -1 }).lean();
  if (!row) return unpublishedDiesel();
  return {
    available: true,
    product: dieselProduct,
    productLabel: dieselProductLabel,
    priceVndPerLitre: row.priceVndPerLitre,
    priceKind: row.priceKind,
    priceKindLabel: dieselPriceKindLabels[row.priceKind],
    unit: dieselUnit,
    documentNumber: row.documentNumber,
    sourceUrl: row.sourceUrl,
    announcedOn: row.announcedOn,
    effectiveAt: row.effectiveAt.toISOString(),
    verifiedAt: row.verifiedAt.toISOString(),
    message: null,
    officialIndexUrl: dieselOfficialIndexUrl,
    latestKnownDocument: latestKnownDieselDocument,
    disclaimer: dieselDisclaimer,
  };
}
