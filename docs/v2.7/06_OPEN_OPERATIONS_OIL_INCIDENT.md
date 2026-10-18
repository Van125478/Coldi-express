# 06 — Other MVP domains: Oil, Incident, QA (still open)

> **Trong repository:** `docs/v2.7/`. Đây là chính sách nghiệp vụ hiện hành ngày 2026-10-18. Phê duyệt tài liệu không có nghĩa module đã được code. Mục lục: [README](README.md).


## Oil price (OIL-01 Approved only)
Show latest published **WORLD CRUDE OIL PRICES**, e.g. Brent/WTI if supplier chosen, USD/barrel, official/source URL, observation date, retrieval timestamp, stale indicator, cached last good value; NEVER vehicle fuel consumption, trip liters, Vietnamese retail diesel, estimated transport cost by car. **OPEN:** provider/API EIA vs alternative, view placement, update cadence, stale timeout, missing value/error handling.

## Incident reporting
Dedicated incident domain for driver/carrier/shipper as roles later approved. Do not auto-transition Shipment to `INCIDENT` or auto-HOLD commission on incident report. **OPEN:** who reports/reviews/resolves, incident state transitions, category/severity, evidence/files, notification/SLA, privacy permissions. Shipment lifecycle stays independent unless a specific rule is approved.

## QA and acceptance
Layout accepted: Carrier Home, Carrier Trip Assignment, Driver Home, Shipper/Carrier Chatbox structure; this is **visual layout** acceptance. Browser E2E, persisted chat and Mapbox tiles/markers still not fully verified. Backend logistics exists; no claim package/commission/oil/incident production code complete. Separate production vs demo source/data/keys; do not seed development DB `coldi`. Maintain historical Core 08–14 and v2.4 docs.
