# PKG-BIZ-01 — Transparent Business and Enterprise pricing

Status: **PROPOSED**. **WAITING FOR PRODUCT OWNER APPROVAL**.

This document does not change Business Documentation v2.10, the live package catalog, commission rates, vehicle caps, or the pricing UI. Public contract plans still display the published label `Liên hệ báo giá` until a later documentation version is approved and then implemented.

No monthly price, yearly price, commission rate, or Enterprise vehicle cap is selected here. Midpoints of the current ranges are intentionally not used.

## What is already published

| Plan | List price | Commission | Vehicle cap |
|---|---|---|---|
| Shipper Free | 0 VND | 5% (500 bps) | Not a carrier plan |
| Shipper Pro Monthly | 799.000 VND/tháng | 4% (400 bps) | Not a carrier plan |
| Shipper Pro Annual | 7.990.000 VND/năm | 3,5% (350 bps) | Not a carrier plan |
| Shipper Enterprise | Quote required | Contract range 2–3% (200–300 bps) | Not a carrier plan |
| Carrier Free | 0 VND | 5% (500 bps) | 2 ACTIVE |
| Carrier Pro Monthly | 999.000 VND/tháng | 4% (400 bps) | 10 ACTIVE |
| Carrier Pro Annual | 9.990.000 VND/năm | 3,5% (350 bps) | 10 ACTIVE |
| Carrier Business | Quote required | Contract range 2,5–3% (250–300 bps) | 30 ACTIVE |
| Carrier Enterprise | Quote required | Contract range 1,5–2,5% (150–250 bps) | By contract, no numeric cap stored |

## Decisions still required

For each of Shipper Enterprise, Carrier Business, and Carrier Enterprise, Product Owner approval needs all of the following before implementation:

| Decision | Proposed value |
|---|---|
| Price VND per month | UNSET |
| Price VND per year, if a yearly term is sold | UNSET |
| Single commission rate in basis points | UNSET. Do not pick the midpoint of the current range. |
| Carrier Business vehicle cap | Keep 30 unless a new cap is approved. Not changed by this proposal. |
| Carrier Enterprise vehicle cap | UNSET. The current catalog stores no numeric cap. |
| Benefits that the product actually enforces | UNSET beyond the current contract-plan behavior |

## Impact if a later approval sets fixed prices

- Existing subscriptions keep the commercial terms already snapshotted on the subscription document. A catalog edit must not rewrite those rows.
- Commission snapshots already stored on shipments stay unchanged. A new rate applies only to a new snapshot created under the approved rule.
- The commission ledger is append-only. Fixed prices must not update or delete ledger events.
- Shipments already in transit stay assigned to their carrier, vehicle, and driver.
- Plans that are already published stay visible. This proposal does not hide Enterprise or Business.
- Backward compatibility: accounts on Free and Pro keep the current numeric prices. Quote-required plans stay quote-required until the approved catalog version replaces `priceVnd: null` with an approved integer and replaces the range with one approved rate.
- Delivery sequence after approval: publish the next Business Documentation version, then change the server catalog, pricing labels, and tests in the same implementation. Do not patch v2.10 in place.

## Explicit non-decisions

This proposal does not authorize a production mid-term switch between paid plans, an immediate production downgrade, or a new Enterprise cap shown as unlimited.
