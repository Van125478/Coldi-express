# COLDI v2.6 — Package Management, entitlement, quota & lifecycle

> **Luật hiện hành:** [v2.7 — vòng đời gói](../../v2.7/03_PACKAGE_LIFECYCLE_AND_SECURITY.md). PKG-02, PKG-03, PKG-06B và PKG-07 đã duyệt. Câu "mọi gói trả phí đều cần Admin phê duyệt" trong các mục dưới là bản thảo lúc PR #4. Nó bị thay bởi: Demo/QA được phép tự kích hoạt khi môi trường được cấp phép; production không đăng ký endpoint kích hoạt demo và không tự thu tiền. Quota đơn Shipper và quyền lợi Premium vẫn mở. Hiện không có Subscription model/API trong `main`.

**Đã duyệt hướng:** gói cho cả SHIPPER và CARRIER; gói thuộc User; trần xe ACTIVE; hết hạn về Free; thanh toán online sau MVP. Các bước Admin duyệt trong file này là hồ sơ bản thảo, không phải đường kích hoạt production.

## 1. Diễn viên và quyền sơ bộ

| Actor | Quyền đề xuất | Không được mặc định |
| --- | --- | --- |
| Guest | Xem bảng giá công khai và điều khoản cơ bản | Kích hoạt gói, xem thông tin account khác |
| SHIPPER | Xem/chọn gói Shipper, gói đang hiệu lực, hạn mức/quyền lợi, gửi yêu cầu chuyển gói | Chỉnh phí hoặc tự cấp Pro |
| CARRIER | Tương tự cho gói Carrier, fleet cap và entitlement | Gán gói cho nhà xe khác |
| DRIVER | Được hoàn thành chuyến được assign ngay cả khi gói Carrier hết hạn | Mua gói riêng hoặc xem billing Carrier mặc định |
| ADMIN được cấp permission | Quản lý catalog, phê duyệt/cấp/hết hạn/ghi nhận audit | Xem GPS/báo cáo đơn toàn hệ thống nếu không có phép rõ ràng |

## 2. PKG-01 — Xem danh mục công khai

**Precondition:** bảng giá đã được duyệt, mô tả đúng phiên bản và trạng thái tính năng. **Luồng:** User chọn tab Shipper/Carrier → API trả danh mục plan đang published → UI hiển thị giá, chu kỳ, hoa hồng, cap và điều kiện hợp đồng → click "Xem chi tiết" chỉ xem được quyền lợi có thực → không tạo subscription. **Exception:** Chưa duyệt giá → hiển thị nhãn 'Bản đề xuất' hoặc không công bố thanh toán; Enterprise không rate cố định → 'Liên hệ báo giá'; API lỗi → thông báo thử lại, không dựng plan giả.

## 3. PKG-02 — Free mặc định (đề xuất)

**Trigger:** tạo tài khoản hợp lệ bằng cơ chế được duyệt (lưu ý self-signup hiện chưa có API).

1. Hệ thống tạo `PlanAssignment` Free theo nhóm vai (Shipper/Carrier), version; `ACTIVE` từ thời điểm kích hoạt.
2. Không cần thanh toán; UI gói hiện tại hiển thị Free; không tạo payment/fee subscription 0 VND thành công giả.
3. Nếu account có assignment đang active, retry không tạo hai Free record.
4. Nếu user chuyển vai (hiện một tài khoản một role), phải có migration policy; không tự dùng plan Shipper cho Carrier.

**Open:** Có gán Free ngay cho demo/seed accounts hay migrate bằng admin script? Không tự chạy migration khi chưa được duyệt.

## 4. PKG-03 — Yêu cầu gói trả phí, chưa có online payment

1. Shipper/Carrier chọn plan (Monthly/Annual/Business/Enterprise) → FE hiển thị giá, hoa hồng, điều kiện, quyền lợi hiện đang hoạt động và dự kiến.
2. User bấm **'Gửi yêu cầu nâng gói'**, server tạo `PlanRequest=PENDING` với account ID, plan/version, timestamp và idempotency key.
3. Admin có quyền xem yêu cầu và xác nhận **căn cứ ngoài hệ thống** nếu chính sách cho phép (không mặc định 'đã thanh toán').
4. Admin phê duyệt cùng lý do/tham chiếu: tạo assignment `ACTIVE`, lưu `effectiveFrom/effectiveUntil`, actor, audit; ghi nhận request approved.
5. User xem đúng gói mới và entitlement mới. Yêu cầu bị từ chối: `REJECTED` kèm lý do; gói cũ không đổi.
6. Không cấp Pro khi request còn PENDING; không cho người khác approve request bằng cách sửa payload client.

**Open:** Quyền và bằng chứng kích hoạt thủ công/đối soát ngoài hệ thống, liệu có thực sự bán gói ở pilot hay chỉ cấp sandbox để demo.

## 5. PKG-04 — Quota/entitlement backend

Tạo một bảng `entitlementKey` duy nhất với version/owner, ví dụ `MAX_ACTIVE_VEHICLES`, `ADVANCED_MARKETPLACE_FILTER`, `EXPORT_REPORT`, `MULTI_TRIP_GPS_DASHBOARD`, `PRIORITY_SUPPORT`. Đây là **ví dụ proposed**, không phải những khả năng đã có code.

**Khuyến nghị baseline:** Không khóa các chức năng vận hành đã có cho Free trong bản demo khi chưa duyệt: xem giá cước thật trước Claim, chat, Claim, assign trong giới hạn xe, pickup/delivery, xem trạng thái và GPS của chuyến chính mình liên quan. Premium nên là **khả năng bổ sung thực sự** (dashboard tổng hợp, báo cáo xuất, quản trị nhiều người nếu sau này code).

**Capacity:** ảnh Carrier mô tả Free 1–2, Pro 3–10, Business 11–30, Enterprise >30. **Đề xuất hard cap tối đa** nếu được duyệt: 2/10/10/30/theo hợp đồng; min tier là marketing, không ngăn Pro sở hữu 1 xe. Định nghĩa `ACTIVE` vs `ARCHIVED` vehicle khi module hỗ trợ lưu trữ; hiện fleet chưa có delete/archive được chốt.

**Thêm xe:** backend đọc plan→entitlement và đếm fleet đúng owner→check cap→write atomic/serializable/idempotent để hai POST cùng lúc không vượt cap. Nếu vượt: trả mã business `plan_limit_exceeded` với giới hạn và số đã dùng; FE đề xuất upgrade mà vẫn giữ dữ liệu form. Nếu action thất bại không tính quota. Khi downgrade dưới số xe đã tồn tại: không xóa xe; cần quy tắc read-only/new-action freeze được ký.

**Shipper quota:** ảnh không quy định số lượng đơn/tháng; **KHÔNG tự đặt giới hạn đơn**. Nếu muốn quota theo số đơn, cần chốt số, khung thời gian (Asia/Ho_Chi_Minh), what counts (draft/published/canceled), idempotency, refund, abuse detection.

## 6. PKG-05 — Upgrade/downgrade

- **Upgrade**: request→approved→new assignment với lịch sử gói cũ; khi không có billing/proration, chỉ làm theo policy admin đã duyệt. Entitlements mới hiệu lực từ time được cấp.
- **Downgrade**: yêu cầu→chính sách hiệu lực ngay/cuối kỳ (OPEN); snapshot commission của chuyến đã publish/claim không thay đổi. Nếu đã có 8 xe và về Free 2 xe, **không xóa 6 xe/không gỡ phân công đang chạy**. Đề xuất giữ dữ liệu để xem; hạn chế thêm/sửa/gán chuyến mới khi vượt cap *chỉ nếu được phê duyệt*, không ngăn tài xế hoàn thành chuyến đã gán.
- **Switch monthly→annual**: không tự cộng dư tiền/chia phí; cần policy proration, có thể cho admin chọn ngày hiệu lực.
- **Change during active shipment**: preserved snapshot. Không mutate `latestLocation`/status.

## 7. PKG-06 — Hết hạn, gia hạn, bị khóa

**Đề xuất:** Free không hết hạn theo chu kỳ; Monthly đến ngày tương ứng tháng sau, Annual đến ngày tương ứng năm sau; Enterprise theo hợp đồng. Cần chốt xử lý ngày 29–31, timezone, mốc UTC, grace. Không auto-renew hoặc auto-charge khi chưa có payment online.

Khi hết hạn: chuyển trạng thái assignment sang `EXPIRED` rồi áp policy Free/default/grace được duyệt. Cần job idempotent hoặc check `effectiveUntil` tức thời ở backend; backend không nên tin cron đơn độc. Nếu user còn shipment `IN_TRANSIT`, Driver được tiếp tục pickup/delivery/GPS theo quyền chuyến, tránh phá nghiệp vụ/ẩn thông tin thiết yếu.

Khi account LOCKED (security), lock có ưu tiên bảo mật; không diễn giải đó là hết hạn gói. Khi đăng ký yêu cầu Pro còn PENDING, quyền thực tế vẫn gói active trước đó.

## 8. PKG-07 — Catalog & admin

Chỉ admin có permission cụ thể `package.catalog.write` mới tạo/ẩn phiên bản plan; phiên bản đang áp cho account hoặc nằm trong snapshot shipment **không xóa**. `package.request.approve` và `package.assignment.manage` có audit actor, timestamp, before/after, reason, evidence reference.

Admin hiện chỉ có placeholder `/admin`; cần implement UI/API scope hẹp, không gắn thêm quyền đọc logistics toàn hệ thống hoặc GPS.

## 9. Data/domain DRAFT

- `PlanDefinition` versioned, role type, public display, fee cycle and currency.
- `PlanEntitlement` key, unit, cap or boolean, plan version; phân biệt description marketing với feature thực có.
- `PlanRequest` requester/plan/status, reviewer, decision reason.
- `PlanAssignment` subject (User hiện tại hay Organization sau quyết định), start/end/status, origin, audit.
- `UsageCounter/UsageLedger` per subject, action/window, idempotency key + transactional semantics.
- `CommissionSnapshot` độc lập với `PlanAssignment` (đọc v2.6 Commission policy).

No silent `tenantId` migration. Nếu nhiều chi nhánh/multi-user Enterprise được đưa vào MVP, phải có decision mở kiến trúc mới.

## 10. Chức năng cơ bản phải test

- Free đúng role; PlanRequest không kích hoạt quyền; admin không được duyệt của người khác theo payload giả.
- Bảng quyền từ server, không chỉ ẩn nút FE; boundary cap `N−1`, `N`, `N+1`; 2 requests đồng thời chỉ một thành công khi còn 1 slot.
- Downgrade không xóa records/không làm gãy trip in progress; gói expired không làm đổi commission snapshot chuyến đã nhận.
- Rollover monthly/yearly leap day/timezone; cron thất bại vẫn kiểm tra đúng thời hạn.
- No Cross-account reads of package/usage; audit có lý do; catalog draft không công bố như paid/live.
- Nếu admin mất mạng sau approve, retry idempotent không cấp 2 assignment.
