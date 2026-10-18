# COLDI v2.6 — Current architecture vs proposed modules

## 1. Source baseline đã đọc

Repository `Van125478/Coldi-express`, `main` tại `7d07e941...` (18/10/2026, merged PR #3). Express/TypeScript + MongoDB/Mongoose backend; React/Vite frontend. **Không có commit code mới nào được tạo khi soạn docs v2.6.**

Hiện backend mount:

| Path hiện có | Mục đích | Ghi chú |
| --- | --- | --- |
| `/api/auth` | login/me/logout/đổi mật khẩu | Cookie session/role gate |
| `/api/shipments` | SHIPPER publish/list/detail/read location + chat | Chỉ đúng chủ đơn |
| `/api/carrier/shipments` | marketplace/claimed/detail/claim/assign/read location | Carrier quyền theo `carrierId` |
| `/api/carrier/conversations` | mở/gửi/đọc chat theo chuyến | Không Claim |
| `/api/carrier/fleet` | xe, tài xế, khóa/unlock/reset | Theo nhà xe sở hữu |
| `/api/driver/shipments` | chuyến được gán, pickup, location, delivery | GPS chỉ khi IN_TRANSIT |

Từ tree/review hiện tại: KHÔNG có route/model/FE page `subscriptions`, `commission`, `oil-prices`, `incidents`; Admin `/admin` chỉ placeholder. Không suy ra modules hoạt động từ mockup hoặc enum `INCIDENT` trong shipment.

## 2. Bounded contexts được đề xuất

- **Identity & RBAC (existing):** User, role (SHIPPER/CARRIER/DRIVER/ADMIN), session version, driver-carrier relation.
- **Logistics (existing):** Shipment, Vehicle, Conversation, event timeline, latest GPS location.
- **Subscription (new):** Plan Definition, Entitlement, Plan Assignment, Plan Request, Quota/Usage Ledger.
- **Commission (new):** Fee Policy Version, Shipper Fee Snapshot, Carrier Fee Snapshot, Adjustment/Accrual status (không payment).
- **Market Data (new):** Latest observed Brent/WTI quotation cache; một provider adapter.
- **Incident (new):** Incident, IncidentEvent, visibility & assignee.

Không trộn object dầu thế giới với Vehicle/GPS/shipment. Không đẩy CommissionRecord vào ShipmentEvent một cách tùy tiện. Không dùng `shipment.packageCount` để biểu diễn Subscription plan.

## 3. Ràng buộc consistency

**Claim & commission:** claim hiện là conditional Mongo update để một Carrier thắng. Nếu thêm phí, bảo đảm chỉ winner tạo Carrier rate snapshot một lần; giao dịch hoặc outbox/idempotent retry phải nhất quán với hành động nghiệp vụ. Không ghi 'fee accrued' trước giao.

**Quota & action:** nếu giới hạn max vehicle, validate + ghi xe phải atomic theo owner/plan/quota; request retry không đếm đôi; nếu fail validation không trừ quota.

**Fee snapshot & plan switch:** lưu plan version và rate trên Shipment Commission riêng để rate cũ bất biến khi gói thay đổi. Nếu thay đổi cước sau publish, cần policy explicit.

**Market oil feed:** fetch/caching backend tách biệt; timeout EIA không ảnh hưởng readiness vận tải. Display observed date khác fetched timestamp. Không chứa GPS/PII.

**Incident event:** history append-only, quyền based on shipment carrier/shipper/assigned driver, public info và internal notes tách field; không tự cập nhật shipment.status.

## 4. Organization/Enterprise là quyết định kiến trúc

Hiện model User.role là một vai; `carrierId` nối tài xế với nhà xe; không có membership/org. Business/Enterprise đề xuất nhiều tài khoản/chi nhánh/roles **không thể triển khai bằng cách bật flag UI**. Cần chốt rằng v2.6 MVP nhỏ dùng plan trên User hiện tại, còn Enterprise chỉ hiện 'Theo hợp đồng/chờ triển khai', hoặc chủ dự án phải duyệt tổ chức/tenant implementation thành epic khác. Không tự thêm `tenantId` vào toàn bộ collection.

## 5. Security

- `requireAuth`, `requireOperationalSession`, `requireRole` và object ownership đều phải ở server. Không tin subjectId/role/rate trong request.
- Rate plan/gói doanh nghiệp khác là private; không cấp ADMIN quyền đọc GPS/chat/đơn tất cả chỉ vì module gói.
- Nguyên tắc audit: ai, lúc nào, thay đổi gì, before/after/lý do với quyền nội bộ; không lưu mật khẩu hoặc token; audit không được làm lộ business data giữa tenants.
- Source oil giá thị trường công khai có thể public read và cache; admin token feed chỉ trên server.

## 6. Migrations/backfill — chưa được phép thực hiện

Đề xuất migration plan Free cho account demo/hiện có; nếu plan khác không được tự áp. Cần dry-run + audit + DB snapshot, không chạy trên `coldi` dev khi chưa cho phép. Không hạ chuẩn qua hardcoded allowlist tạm để qua test.

## 7. Integration dependencies

`PKG definitions` → `Activation/entitlement` → `Quota gate` → `Commission snapshot & fee quote` → `Pricing UX/admin` → `QA`. `OIL market data` độc lập vận tải. `INCIDENT` phụ thuộc identity + shipment ownership và workflow shipment, không phụ thuộc gói trừ quyền premium báo cáo nâng cao sau này.
