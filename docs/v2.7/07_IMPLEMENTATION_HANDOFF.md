# 07 — Implementation handoff (NOT IMPLEMENTED)

> **Trong repository:** `docs/v2.7/`. Đây là chính sách nghiệp vụ hiện hành ngày 2026-10-18. Phê duyệt tài liệu không có nghĩa module đã được code. Mục lục: [README](README.md).


Suggested modules: `planDefinitions`, `planVersions`, `subscriptions`, `entitlementResolver`, `fleetCapacity`, `commissionSnapshots`, `commissionLedger`, `commissionReconciliation`, `demoActivationGuard`. Mongo/Mongoose, TypeScript; `Vehicle` ACTIVE/ARCHIVED not yet in source, `POST /api/carrier/fleet/vehicles` currently creates directly. New routes proposed: `GET /api/my-plan`, `GET /api/plans`, `POST /api/my-plan/demo-activate` (only QA/demo), `POST /api/carrier/fleet/vehicles/:id/archive|restore`, `GET /api/my-commission`; authorized scoped admin HOLD/RELEASE/ADJUST APIs need permission approvals.

**Production default deny:** no demo route; no payment, payout, real reconciliation endpoints. `APP_RUNTIME_MODE` + flag + deployment authorization + separated DB/roles/credentials. QA self activation cannot be enabled by `NODE_ENV` alone. A publish/claim commit requires consistent snapshot and plan rate. Archive/assign collision, vehicle cap concurrency, cancel/delivery collision tested. Avoid using only countDocuments+create. Append-only ledger, unique `(shipmentId,payerSide,initialAccrual)` and distinct adjustment idempotency; transaction or outbox with reconcile.

**Before coding:** finalize still-open cancellation/dispute/role matrices, entitlement feature switches, pricing contract details and midterm upgrade. Link historical docs, do not discard FE-05A evidence. Work on clean clone/worktree from origin/main; do not reset/stash/clean/checkout dirty `C:\Coldi`, do not touch DB `coldi`, do not run seed/reset without explicit confirmation. No `git add -A` on dirty root. Do not claim tests passed if not executed.
