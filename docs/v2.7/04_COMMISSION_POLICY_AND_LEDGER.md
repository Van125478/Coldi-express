# 04 — Commission contract & ledger (COM-01 through COM-07 APPROVED)

> **Trong repository:** `docs/v2.7/`. Đây là chính sách nghiệp vụ hiện hành ngày 2026-10-18. Phê duyệt tài liệu không có nghĩa module đã được code. Mục lục: [README](README.md).


## 1. Formula
B = immutable Shipment.`listedPriceVnd` (positive safe integer VND). Shipper rate Rs and Carrier rate Rc stored as integer basis points in **separate immutable snapshots**. Fees: `Fs=(B*Rs+5000)/10000` integer division, `Fc=(B*Rc+5000)/10000` integer division; this is round-half-up to 1 VND for nonnegative amounts. Calculation in TypeScript use `BigInt`, validate bps/ranges, and serialize as decimal strings or bounds-checked safe integers. **Round each fee separately, then sum**. Quoted Shipper total B+Fs, Carrier net B−Fc, platform gross estimated Fs+Fc — **none is cash collected**. VAT, tax invoices, online payment after MVP. Do not compute refund using negative base inputs.

## 2. Snapshot timing
- Publish success: atomic creation `Shipment(PUBLISHED, ShipperCommissionSnapshot, PUBLISHED event)`; Shipper snapshot has payer, accountId, planCode/version, contractTermsId if any, baseFreightVnd, rateBps, policyVersion, lockedAt, source=DEMO_QA as relevant.
- Winning Claim: atomic Shipment conditional transition `PUBLISHED -> MATCHED`, carrierId and CarrierCommissionSnapshot + CLAIMED event in same document update. Loser Claim gets conflict without commission snapshot. Do NOT update snapshot after plan change or expiration.
- Consider plan/claim race: subscription version must be validated at commit boundary, using transaction or CAS/retry with consistent entitlement read. If quote preview becomes stale, require user re-confirm rate. No unapproved changes to listedPrice after publish. Existing shipments without historical snapshot: do not infer from present-day subscription.

## 3. State machine per payer-side
`ABSENT -> ESTIMATED` at corresponding snapshot. `ESTIMATED -> ACCRUED` **only** on valid DELIVERY_CONFIRMED, independently for SHIPPER/CARRIER. Cancellation via approved shipment cancellation workflow before Delivery -> `ESTIMATED -> VOID` for existing estimates only. After Delivery: `ACCRUED -> ON_HOLD` for authorized scoped dispute, `ON_HOLD -> ACCRUED` on release; immutable `ADJUSTMENT` event modifies effective balance, not original snapshot/accrual. `VOID` is terminal absent a separately approved correction policy. A shipment incident does not auto-HOLD or auto-cancel. `PAID` never automatic or enabled for current Demo/QA MVP.

## 4. Ledger
Separate per-side `CommissionAccount` read model and append-only `CommissionLedgerEvent` containing shipmentId,payerSide,payerAccountId,eventType,amountVnd,deltaVnd,planVersionId,rateBps,baseFreightVnd,sourceEventId,actorId,reason,evidenceRef,policyVersion,environmentId,idempotencyKey,recordedAt. One initial accrual per `(shipmentId,payerSide)` enforced with unique index; adjustments are separately identified and idempotent. `effectiveFee = originalAccrual + sum(approvedAdjustmentDeltas)` cannot be negative in current proposal. Keep immutable original records. `ON_HOLD` is a processing restriction, not subtraction from the original accrual.

## 5. Delivery consistency
For multi-document Shipment->Ledger use Mongo transaction if supported, or Shipment-embedded transactional outbox with idempotent worker and reconciliation. Do not mark read model ACCRUED before ledger successfully reconciled. Prevent double `DELIVERY_CONFIRMED` and double accrual on retries/crashes. Cancel vs Delivery competing writes must serialize via conditional status/version CAS. Publish and Claim retry need idempotency as well. Audit error recovery must not create phantom fees.

## 6. COM-07A — Demo/QA only, no real money
- **APPROVED:** Commission preview, estimation, accrual, scoped hold/adjustment ledger are SIMULATED ONLY in Demo/QA; no charge, payout, refund, settlement, proof-of-payment, financial reconciliation or manual marks as PAID in MVP.
- Production must not expose demo activation and must not treat demo data as real billing. Unless a separate production commission/billing policy and secure workflow are approved, production financial-writing endpoints default denied; no auto-generated invoice/receipt or transfer. The planned core logistics API is independent of simulated Commission processing until safe rollout rules are approved.
- Shipper sees own fee, Carrier own fee; Driver cannot mutate Commission; Admin must have explicit scoped authority for HOLD/RELEASE/ADJUST (permission list and approval threshold still OPEN). Full audit with reason/evidence; default deny.
- Numeric preview/reporting must display `Demo/QA`, `Estimated`/`Accrued`/`On hold` and `Không phải tiền đã thu` appropriately. Never call an Estimated or Accrued fee platform *revenue collected*.

## 7. OPEN child policies, not silently decided
- Cancellation eligibility by shipment phase and dispute acceptance criteria/window, evidence requirements, exact Admin permission matrix, approved adjustments ceiling and resolution SLA.
- Proration or immediate upgrades, contract-specific terms and premium entitlement feature matrix.
- The choice of transaction versus outbox is technical design/QA-dependent; both need exhaustive failure-recovery testing.
