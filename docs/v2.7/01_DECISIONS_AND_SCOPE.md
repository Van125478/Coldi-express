# 01 — Scope & Decision Register — CURRENT v2.7

> **Trong repository:** `docs/v2.7/`. Đây là chính sách nghiệp vụ hiện hành ngày 2026-10-18. Phê duyệt tài liệu không có nghĩa module đã được code. Mục lục: [README](README.md).


| ID | Approved policy |
|---|---|
| COM-01 | COLDI tính phí riêng Shipper và Carrier |
| COM-02 | Hai phí cùng dùng `listedPriceVnd`, không tính chồng |
| COM-03 | Snapshot Shipper tại Publish, Carrier tại Claim THÀNH CÔNG |
| COM-04 | integer basis points, round half-up từng bên tới 1 VND; VAT sau MVP |
| COM-05 | ESTIMATED tại snapshot, ACCRUED tại DELIVERY_CONFIRMED; không tự PAID |
| COM-06 | Hủy hợp lệ trước Delivery -> VOID; sau Delivery HOLD từng bên; adjustment bất biến có audit; không refund auto |
| COM-07 | **A**: Chỉ mô phỏng commission trong Demo/QA, không thu tiền/đối soát thật, production không cấp gói demo |
| PKG-01 | Giá và tỷ lệ cố định từ 4 ảnh: commercial baseline dự kiến chính thức, chưa có online sales |
| PKG-02 | Plan owned by User account, DRIVER không mua plan; Organization để tương lai |
| PKG-03 | Carrier hard cap xe ACTIVE: Free=2; Pro M/A=10; Business=30; Enterprise contract |
| PKG-06 | **B**: tự kích hoạt paid plan demo/QA, production forbidden |
| PKG-07 | Hết hạn -> Free, over-cap -> OVER_LIMIT chặn new Claim, giữ chuyến/data; downgrade tự nguyện cuối kỳ; Archive/Restore, không archive xe có chuyến chưa xong |
| OIL-01 | Chỉ giá dầu thô thế giới, KHÔNG thống kê dầu tiêu thụ/đổ dầu |

**OPEN (không tự tạo luật):** PKG-04 quota số đơn Shipper; PKG-05 quyền lợi Premium thực tế; Enterprise per-account contract terms; chi tiết nâng gói giữa kỳ, lệch kỳ và xử lý subscription overlap; cụ thể người có quyền HOLD/RELEASE/ADJUST và quy trình cancel/incident; COM-06 cancellation eligibility, dispute window và adjustment approval thresholds; OIL-02 provider, OIL-03 placement, OIL-04 stale/error rules; INC-01..04; QA readiness / Mapbox token.

**MVP includes** Shipper, Carrier, Driver logistics, subscriptions/caps, fee preview/ledger simulation, oil prices, incident reporting and QA. **Not MVP:** payment gateway, thực thu phí/đối soát tiền thật, VAT/invoicing, vehicle fuel-consumption dashboard, enterprise organization ACL unless later approved. Visual acceptance không thay thế E2E/functional acceptance.
