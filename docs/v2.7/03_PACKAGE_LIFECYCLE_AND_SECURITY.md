# 03 — Package lifecycle, vehicle cap, environment isolation

> **Trong repository:** `docs/v2.7/`. Đây là chính sách nghiệp vụ hiện hành ngày 2026-10-18. Phê duyệt tài liệu không có nghĩa module đã được code. Mục lục: [README](README.md).


## Fleet cap
Count `Vehicle.status=ACTIVE` scoped by authenticated `carrierId`; `ARCHIVED` excluded. Vehicle and archive/restore are proposed schema/APIs not currently implemented. Archive only when NO unresolved/unfinished assigned trips (including MATCHED already assigned, PICKUP/IN_TRANSIT). Restore/create require atomic capacity reservation (transaction or carefully validated CAS). Full cap -> reject `plan_limit_exceeded`; `OVER_LIMIT = activeCount > cap` derived entitlement/operational status not Shipment status nor User.ACCOUNT_LOCKED.

On expiry of paid plan, effective Free at boundary even if scheduled job lags; no auto-charge or renewal. At 8 ACTIVE vs Free cap 2: preserve all vehicles, driver history and all previously claimed shipments; block **new Claim**, new vehicle creation/restore; allow read/history, chat, tracking, assignment of previously claimed trip, delivery/pickup/GPS, archive idle vehicles. After activeCount <=2 or higher plan activated, unblock claim. No silent deletes or forced reassign. Downgrade voluntary at end of active term, not immediately; avoid conflicting/overlapping subscription terms. Upgrades mid-term and proration still OPEN.

## Demo/QA paid activation only (PKG-06B)
- Allowed for authenticated SHIPPER/CARRIER only, with published plan/valid demo contract terms, isolated test accounts and DB. No Admin approval required. DRIVER/ADMIN do not self-activate.
- `APP_RUNTIME_MODE=qa|demo` + explicit `PACKAGE_DEMO_SELF_ACTIVATION_ENABLED=true` plus deployment authorization; default deny. `NODE_ENV` alone **never** grants the ability. Production with flag enabled fails startup; production does not register demo activation endpoint; internal activation service double-checks environment.
- Environment isolation needs separate DB credentials, network policy, secrets, domain, accounts, CI policy and restricted deployment identities. Production must not be able to masquerade as QA by changing one env var. Use dry runs on disposable QA DB only, **never dev `coldi`**.
- Every activation records `activationSource=DEMO_QA`, environmentId, plan version, start/end, idempotency key, actor and audit. No payment row, PAID, receipts or real collections; don't import test activation into production. Contract tier without concrete rate/cap rejected.
- Effective plan resolver uses authoritative timestamp and one subscription per account at a time; expired -> Free. No enterprise organization by implicit company-name match.
