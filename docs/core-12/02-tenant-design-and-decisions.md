# Mô hình tenant và các quyết định còn mở

Core 12 không hoàn thành multi-tenant. Phần dưới tách việc đã có khỏi việc còn bị chặn.

## Trạng thái hiện tại — IMPLEMENTED

Một tài khoản có đúng một `role`: SHIPPER, CARRIER, DRIVER hoặc ADMIN.

DRIVER có thể có `carrierId` trỏ tới tài khoản CARRIER. Xe có `carrierId` trỏ tới tài khoản CARRIER. Đơn có `shipperId` và, sau Claim, `carrierId` của nhà xe thắng. Chat có cặp `shipmentId` + `carrierId`.

Phiên là cookie `HttpOnly`. Mọi thao tác ghi lấy định danh từ phiên. Body không được ghi đè `shipperId`, `carrierId`, `driverId`, `senderId`, `role` hay `tenantId`.

Chưa có collection tổ chức, thành viên, hay `tenant_id`.

## Câu hỏi chưa có trong nguồn đã duyệt

| Câu hỏi | Trạng thái |
| --- | --- |
| Doanh nghiệp được tạo bằng quy trình nào? | BLOCKED / PENDING APPROVAL |
| Tài khoản nào thuộc doanh nghiệp nào? | BLOCKED / PENDING APPROVAL |
| Một tài khoản có được thuộc nhiều doanh nghiệp không? | BLOCKED / PENDING APPROVAL |
| Role Switcher chọn tenant đang hoạt động thế nào? | BLOCKED / PENDING APPROVAL. Handoff vẫn ghi protocol đăng nhập và active tenant là TBD |
| Tài xế được mời, gỡ hoặc chuyển nhà xe ra sao? | BLOCKED / PENDING APPROVAL. Câu hỏi mở về hồ sơ tài xế trong D-05/nhóm Driver |
| Ai được mời hoặc gỡ thành viên? | BLOCKED / PENDING APPROVAL |
| Dữ liệu demo hiện có được gán tổ chức bằng quy tắc nào? | BLOCKED / PENDING APPROVAL. Core 12 không chạy migration và không tự gán membership |
| Tài nguyên nào phải khóa chủ sở hữu tổ chức vĩnh viễn? | BLOCKED / PENDING APPROVAL |

Vì các câu này chưa được chốt, Core 12 không thêm `tenant_id`, không tạo membership giả, và không cho bản ghi thiếu tenant được truy cập theo lối tương thích rộng.

## Đề xuất để duyệt sau — PROPOSED

Đây không phải schema đang chạy.

1. Tạo `Organization` khi một quy trình mở tài khoản doanh nghiệp được duyệt. Không tự tạo tổ chức lúc đăng nhập.
2. `Membership` gồm `userId`, `organizationId`, `role`, và nhiều nhất một membership hoạt động cho đến khi Role Switcher được đặc tả.
3. SHIPPER và CARRIER là hai tổ chức khác nhau. Quan hệ giữa họ là đơn đã đăng và Claim, không phải cùng `tenant_id`.
4. DRIVER giữ membership trong tổ chức của nhà xe. `carrierId` hiện tại chỉ là cầu tạm tới tài khoản nhà xe.
5. Xe và tài xế mang `organizationId` của nhà xe. Đơn mang `shipperOrganizationId` và, sau Claim, `carrierOrganizationId`.
6. Sàn chỉ hiện trường đã được duyệt cho đơn `PUBLISHED`. GPS, chat và đội xe tiếp tục đi theo quan hệ, không theo “cùng tenant”.
7. Migration chỉ chạy sau khi có quy tắc gán tổ chức cho tài khoản demo và đơn đã chấp nhận. Không có fallback “thiếu tenant thì cho xem”.

## Quyền ADMIN — BLOCKED / PENDING APPROVAL

Master Const mô tả ADMIN là ban quản trị nội bộ, gồm kỹ thuật và vận hành. Chưa có danh sách API ADMIN được phép đọc. Core 12 không mở endpoint đọc mọi đơn, đội xe, GPS, chat hay nhật ký cho ADMIN.

## Dữ liệu sàn và dữ liệu riêng

IMPLEMENTED: nhà xe xem được đơn đang mở. Chủ hàng và nhà xe khác vẫn không xem đơn riêng của nhau. Nhà xe chỉ sửa xe của mình. Tài xế chỉ thấy chuyến được gán.

Không thêm kiểm tra “hai bên phải cùng tenant” vào Claim, sàn, chat hay GPS.
