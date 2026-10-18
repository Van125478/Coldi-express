# 05 — Commission & package acceptance tests

> **Trong repository:** `docs/v2.7/`. Đây là chính sách nghiệp vụ hiện hành ngày 2026-10-18. Phê duyệt tài liệu không có nghĩa module đã được code. Mục lục: [README](README.md).


| ID | Scenario | Expected |
|---|---|---|
| COM-T01 | B=10,000,000, Rs=500,Rc=400 | Fs=500,000;Fc=400,000 independent; gross estimate=900,000 |
| COM-T02 | B=1,000,100,R=350 | fee=35,004 half-up |
| COM-T03 | B=10,R=500 | fee=1 |
| COM-T04 | B=9,R=500 | fee=0; no artificial minimum |
| COM-T05 | B=100,R=350 | fee=4 |
| COM-T06 | B=0 / negative / fractional / unsafe JS integer | Reject input; no ledger side effects |
| COM-T07 | Rate fractional bps / missing contract rate | Reject; don't default midpoint |
| COM-T08 | Two Carriers simultaneously Claim | Exactly one winner/Carrier snapshot |
| COM-T09 | Shipper plan changes after Publish | Original Shipper snapshot remains |
| COM-T10 | Carrier plan expires after Claim | Original Carrier snapshot remains |
| COM-T11 | Quote stale due to subscription change before Claim | Re-confirm before commit |
| COM-T12 | Shipment PUBLISHED | Shipper ESTIMATED, Carrier absent |
| COM-T13 | Successful Claim | both ESTIMATED |
| COM-T14 | Pickup and GPS | Neither becomes ACCRUED |
| COM-T15 | Delivery Confirmed | Exactly 2 initial ACCRUAL, no PAID |
| COM-T16 | 2 Delivery retries; crash before response | No duplicate timeline/accrual |
| COM-T17 | Outbox failure after Delivery | Pending observable + idempotent repair |
| COM-T18 | Valid cancel before Delivery | Existing ESTIMATED -> VOID; absent Carrier stays absent |
| COM-T19 | Cancel vs Delivery simultaneous | One valid Shipment outcome; ledger matches |
| COM-T20 | Shipper-only dispute after Delivery | Only Shipper ON_HOLD; Carrier ACCRUED |
| COM-T21 | -100k approved adjustment of 500k | immutable -100k event; effective 400k |
| COM-T22 | Adjustment would make effective fee negative | Reject |
| COM-T23 | Duplicate adjustment idempotency key | Applied once |
| COM-T24 | Legacy shipment lacks snapshot | No invented fee from current plan |
| COM-T25 | Authenticated foreign account reads fees | Forbidden |
| COM-T26 | Driver/Admin without explicit permission mutates fees | Forbidden |
| COM-T27 | QA Demo activation + test accrual | flagged simulation, no payment row/PAID |
| COM-T28 | Production calls demo activation / money simulation writes | Rejected / route absent |
| COM-T29 | Production launch with demo flag=true | Fails safe, does not start vulnerable configuration |
| PKG-T01 | Free adds third ACTIVE vehicle | Reject cap=2 |
| PKG-T02 | 2 concurrent fleet adds on final slot | Exactly 1 success |
| PKG-T03 | Archive vehicle with unfinished assigned trip | Reject |
| PKG-T04 | Paid expires at 8 ACTIVE | Free cap 2, OVER_LIMIT, claim disabled, old trips proceed |
| PKG-T05 | Reduce ACTIVE 8 to 2 / upgrade Pro | Exit OVER_LIMIT when cap permits |
| PKG-T06 | Auto expiry during in-transit GPS/delivery | Essential operations remain available |

**Required test hygiene:** disposable QA DB, synthetic user accounts, isolated demo credentials and Mapbox public `pk.` token only if map test necessary. Do not access dev database `coldi` or claim FE-05B/Mapbox passed without browser proof.
