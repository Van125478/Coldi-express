# COLDI v2.6 — Báo cáo sự cố vận chuyển (Incident Reporting) DRAFT

**APPROVED scope:** Module báo cáo sự cố là MVP REQUIRED. **Chưa chốt** phân quyền chi tiết, loại sự cố, tác động đến chuyến, ảnh/file, deadline/SLA; toàn bộ chi tiết dưới đây là **đề xuất có thể duyệt/đổi**. Baseline code Shipment enum có `INCIDENT`, **không** có API/report lifecycle; không coi enum là feature.

## 1. Use cases

| Mã | Actor đề xuất | Hành động | Kết quả |
| --- | --- | --- | --- |
| INC-01 | DRIVER được gán / CARRIER chủ claim | Tạo incident cho shipment | Record OPEN gắn đúng shipment, reporter và timestamp |
| INC-02 | CARRIER chủ claim | Xem danh sách sự cố của các chuyến mình có quyền | Phân trang, lọc OPEN, không lộ doanh nghiệp khác |
| INC-03 | CARRIER chủ claim | Tiếp nhận/xử lý incident | Cập nhật trạng thái, action note, audit |
| INC-04 | SHIPPER chủ đơn | Xem sự cố ảnh hưởng chuyến mình | Read-only hoặc phản hồi theo chính sách được duyệt |
| INC-05 | CARRIER/authorized reviewer | Giải quyết/đóng | Có resolution, actor, thời gian; không xóa incident gốc |
| INC-06 | ADMIN được cấp quyền | Hỗ trợ/trung gian trong các case escalated | Chỉ case được phân công, không tự đọc GPS toàn cục |

## 2. Form tạo incident (MVP đề xuất)

- `shipmentId` từ route mà user có quyền, không tin ID chủ thể gửi tự do.
- `incidentType` từ tập có version: `TEMPERATURE_ISSUE`, `VEHICLE_ISSUE`, `PICKUP_DELIVERY_ISSUE`, `DELAY`, `CARGO_ISSUE`, `OTHER` — **đề xuất**, chưa duyệt enum.
- `title` ngắn, `description` dễ hiểu, `reportedAt` server time; priority `LOW/MEDIUM/HIGH` **nếu quyết định**.
- Ảnh/file là optional và **chưa cam kết** trong MVP; nếu có phải xét storage, malware/size, consent, retention.
- Không yêu cầu tài xế tương tác trên điện thoại khi đang lái; cần dừng xe an toàn trước khi thao tác.

## 3. Incident lifecycle đề xuất

`OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED`.

Có thể cho `RESOLVED → OPEN` (reopen) khi chủ thể phù hợp xác nhận chưa xử lý xong. Mỗi transition có event actor, timestamp, note, before/after. Không sửa các sự kiện cũ. Nếu cần tối giản MVP: `OPEN → IN_PROGRESS → RESOLVED → CLOSED` (sau khi Product Owner chọn).

**Shipment vẫn ở trạng thái vận chuyển hiện có.** Mở incident **không tự set** `shipment.status='INCIDENT'`, không pickup/delivery hộ, không tạo payment. Chuyến nào không thể tiếp tục cần use case đình chỉ/hủy riêng được duyệt; đừng lén mở rộng.

## 4. Quy tắc phân quyền DRAFT

- Driver chỉ báo/xem trên chuyến được assign; nếu hết quyền sau giao, quyền xem lịch sử cần được duyệt.
- Carrier chỉ đọc/sửa sự cố của shipment có `carrierId` là account hiện tại; không được dùng route id bất kỳ để xem lỗi nhà xe khác.
- Shipper chỉ đọc incident của shipment có `shipperId` là session, không thấy ghi chú nội bộ nhạy cảm nếu có.
- Admin không mặc định có quyền xem toàn bộ GPS, chat, dữ liệu doanh nghiệp; chỉ case được chỉ định và permission cụ thể.
- Guest và user sai role nhận 401/403/404 đúng chính sách giấu sự tồn tại của record.

## 5. Các luồng đặc biệt

### Báo trùng cùng lúc
Không xóa hoặc gộp tùy tiện; đề xuất hỗ trợ `clientRequestId/idempotencyKey`, gợi ý incident đang mở tương tự trên cùng chuyến. Thao tác submit lặp không tạo hai sự cố giống hệt do network retry.

### Sự cố ở trạng thái `PUBLISHED`
Chưa có driver/carrier; Shipper có quyền tự báo sự cố trước khi nhà xe nhận hay không? **OPEN**. Nếu không, form Incident chỉ cho shipment MATCHED/IN_TRANSIT.

### Sự cố sau giao
Có cho tạo report trong thời hạn X ngày hay không? **OPEN**. Không tự đặt 7 ngày hoặc 30 ngày. Incident trước giao còn OPEN sau `DELIVERY_CONFIRMED` không đồng nghĩa tự giải quyết.

### Carrier bị thay đổi/cancel
Nếu policy tương lai cho đổi carrier, quyền xem lịch sử incident của carrier cũ/có quyền do luật định cần quy định. Hiện code không hỗ trợ reassign claim theo business.

### Incident HIGH không ai xử lý
Notification nội bộ/nhắc việc do policy phê duyệt; không tự phát cảnh báo khẩn cấp hoặc khẳng định nhân sự hỗ trợ 24/7 nếu chưa có SLA.

## 6. Dữ liệu đề xuất

`Incident` {`_id`, `shipmentId`, `reporterId`, `reporterRole`, `type`, `title`, `description`, `status`, `createdAt`, `updatedAt`, `ownerCarrierId`, `visibility`?}; `IncidentEvent` immutable {`incidentId`, `actorId`, `action`, `before`, `after`, `reason`, `time`}. Tập trường/phân quyền phải duyệt; record không đổi Shipment.latestLocation hay price.

## 7. UAT tối thiểu

- Driver không được gán không thể báo. Carrier khác không đọc được incident. Shipper khác không thể đọc.
- Tạo report đúng shipment, xử lý có actor/time, đúng transition, reopen nếu policy duyệt.
- Reload vẫn còn record; API lỗi giữ bản nháp; duplicate submit không tạo hai incident.
- `IN_TRANSIT` vẫn IN_TRANSIT khi incident OPEN, Driver vẫn được giao nếu không có hold policy.
- Xử lý sự cố không tạo trạng thái `PAID`, không phát sinh phí phạt/hoàn tiền tự động.
