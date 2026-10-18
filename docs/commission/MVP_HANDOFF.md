# Commission Management MVP — technical handoff

Baseline: `origin/main` after PR #8 Incident Reporting and PR #9 Package UI. Business documentation v2.10 is unchanged.

This is a simulation. It locks a commission rate and can record an accrual. It does not collect money, create a payment, an invoice, a payout, a refund, or a `PAID` state.

Business documentation v2.10 is unchanged. Prices, rates, and fleet caps are unchanged.

## Status

| Item | Status |
| --- | --- |
| Formula COM-01, half-up to 1 VND, separate shipper and carrier rates | IMPLEMENTED, TESTED |
| Shipper snapshot on successful publish | IMPLEMENTED, TESTED |
| Carrier snapshot only for the winning claim | IMPLEMENTED, TESTED |
| Ledger `ESTIMATED` then `ACCRUAL` on `DELIVERY_CONFIRMED` | IMPLEMENTED, TESTED |
| Idempotent accrual and outbox repair | IMPLEMENTED, TESTED |
| Read API for the owning shipper or carrier | IMPLEMENTED, TESTED |
| Shipper and carrier history UI reading that API | IMPLEMENTED. Browser walkthrough NOT RUN |
| VOID wired to cancellation | BLOCKED. No approved cancellation workflow exists in code |
| HOLD, RELEASE, ADJUSTMENT HTTP | BLOCKED. Default deny until permission, threshold, and dispute rules are approved |
| Production collection, payout, settlement | Not implemented. Production simulation flag refuses to start |
| Incident reporting | Independent. An incident does not HOLD commission, does not block delivery, and does not create a second accrual |

## Calculation

`B` is `Shipment.listedPriceVnd`.

`Fs = roundHalfUp(B × Rs / 10000)` and `Fc = roundHalfUp(B × Rc / 10000)`, each rounded before they are added. The implementation uses `BigInt`: `(base * rate + 5000n) / 10000n`. Floating point is not used. A missing rate, including Business and Enterprise ranges, is rejected. The server does not choose the midpoint.

Shipper estimated total is `B + Fs`. Carrier estimated net is `B − Fc`. `Fs + Fc` is a gross estimate, not collected revenue.

## Snapshot and ledger

There is no replica set, so subscription and shipment are not one multi-document transaction. The shipment document is the commit.

- Publish inserts the shipment, the shipper snapshot, `shipperStatus = ESTIMATED`, `carrierStatus = ABSENT`, and the `PUBLISHED` event together.
- Claim conditionally updates one open shipment. Only the winner stores `commission.carrier` and `carrierStatus = ESTIMATED` with the `CLAIMED` event.
- The client cannot send `rateBps`, `calculatedFeeVnd`, `planVersionId`, `payerAccountId`, `commission`, or `paymentCollected`. Optional `expectedPlanVersionId` is checked immediately before the write. A mismatch returns 409 `commission_quote_stale` and does not write.
- A plan change after that commit does not rewrite the snapshot. A shipment with no snapshot is not backfilled from the current plan.
- A residual window remains: a plan change after the entitlement read and before the shipment write can still be snapshotted at the rate just resolved. That is not claimed to be a transaction.

Accrual runs only after status is `DELIVERY_CONFIRMED`. The same delivery update sets `commission.outbox.status = PENDING` when a snapshot exists. The ledger insert uses idempotency key `accrual:{shipmentId}:{payerSide}` plus a partial unique index on `(shipmentId, payerSide)` for `ACCRUAL`. The read model flips to `ACCRUED` only after those inserts succeed. A failed insert leaves `outbox.status = ERROR` and the side `ESTIMATED`. Startup calls `reconcileCommissionOutbox()` when simulation is allowed. Pickup, GPS, and an incident status do not accrue and do not hold.

`ESTIMATED` rows use `estimated:{shipmentId}:{payerSide}`. A duplicate key is success. If that insert fails, the snapshot remains and a later read retries it.

No ledger row can be stored with `paymentCollected: true` or `simulation: false`. The event enum has no `PAID`.

## API

All routes require a session. Mutations also require a trusted origin and an `Idempotency-Key` of 8–80 safe characters.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/commission/mine` | Shipper or carrier history for that account only |
| GET | `/api/commission/shipments/:id` | That account's side only. Legacy shipments return `legacy: true` and a null fee |
| POST | `/api/commission/holds` | 403 `commission_mutation_denied` |
| POST | `/api/commission/releases` | 403 `commission_mutation_denied` |
| POST | `/api/commission/adjustments` | 403 `commission_mutation_denied` |

Driver and admin reads are 403. Another tenant's shipment is 404. There is no global ledger route. The response includes `paymentCollected: false` and the banner `Mô phỏng Demo/QA — Không phải tiền đã thu`.

The UI at `/shipper/don-hang/:id`, `/carrier/chuyen/:id`, `/shipper/hoa-hong`, and `/carrier/hoa-hong` displays those fields. It does not multiply the rate to produce a fee. There is no pay, withdraw, refund, or mark-paid control.

## Guard

`COMMISSION_SIMULATION_ENABLED=true` starts only when `APP_RUNTIME_MODE` is `qa` or `demo`, the two deployment ids match and are at least 8 characters, and the database name contains `test`, `qa`, or `demo` and is not `coldi`, `admin`, `local`, or `config`. `NODE_ENV` alone does not enable it. Production with the flag set refuses to start. A query parameter or client header cannot turn it on. With the flag off, publish, claim, and delivery behave as before and do not write commission fields.

## Tests run locally

Server `npm test`: 120 passed, 0 failed, on disposable database names derived from `mongodb://127.0.0.1:27017/coldi_ci_test`. Server typecheck and oxlint passed. Web oxlint and production build passed.

Browser acceptance of the shipper and carrier screens was not run.

## Still open

- Which shipment states and reasons may cancel, and therefore when `ESTIMATED` may become `VOID`
- Which admins may hold, release, or adjust, and the approval threshold
- Dispute and escalation
- Cross-tenant aggregate visibility
- Incident, oil price, chat, image, and driver-profile work are outside this branch
