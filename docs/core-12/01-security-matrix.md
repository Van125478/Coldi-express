# Ma trận phân quyền Core 12

Nhãn: IMPLEMENTED là hành vi đang chạy. TESTED là có kiểm thử tự động trong `server/tests/security.test.ts` hoặc bộ test lõi trước đó. PROPOSED là thiết kế chưa được duyệt. BLOCKED / PENDING APPROVAL là chưa được triển khai vì thiếu quyết định.

COLDI hiện có bốn vai trò trên một tài khoản: SHIPPER, CARRIER, DRIVER, ADMIN. DRIVER gắn với một tài khoản CARRIER bằng `carrierId`. Chưa có định danh doanh nghiệp riêng. Vì vậy cột “chủ sở hữu” dưới đây là tài khoản hoặc quan hệ chuyến, không phải tenant công ty.

## Ba lớp dữ liệu

| Lớp | IMPLEMENTED | Ví dụ |
| --- | --- | --- |
| Dữ liệu riêng của tổ chức | Có, theo tài khoản chủ | Đội xe, danh sách tài xế, hồ sơ tài khoản |
| Dữ liệu sàn | Có, đơn `PUBLISHED` chưa có nhà xe | Sàn chuyến của nhà xe |
| Dữ liệu theo quan hệ | Có | Đơn của chủ hàng, chuyến nhà xe đã nhận, chuyến tài xế được gán, chat của đúng cặp chủ hàng–nhà xe, GPS cho chủ hàng sở hữu đơn và tài xế được gán |
| Dữ liệu quản trị nội bộ | Không có API đọc toàn bộ | ADMIN không được suy ra quyền đọc đội xe, sàn, GPS hay chat |

Không áp điều kiện `tenant_id` bằng nhau cho mọi truy vấn. Điều kiện đó sẽ chặn chủ hàng đăng đơn và nhà xe nhận chuyến xuyên tổ chức, trong khi đó là luồng sàn đã chốt.

## Ma trận route

| Route | Vai trò | Nguồn quyền | Quan hệ được phép | TESTED |
| --- | --- | --- | --- | --- |
| `POST /api/auth/login` | Khách | Email và mật khẩu | Không đọc dữ liệu nghiệp vụ | Có, auth |
| `GET /api/auth/me` | Đã đăng nhập | Phiên cookie | Chỉ tài khoản của phiên | Có, auth |
| `POST /api/auth/logout` | Đã đăng nhập | Phiên cookie | Xóa cookie của chính phiên | Có, auth |
| `POST /api/shipments` | SHIPPER | `shipperId` lấy từ phiên | Tạo đơn của chính chủ hàng. `tenantId`, `senderId`, `shipperId` trong body bị từ chối | Có |
| `GET /api/shipments/mine` | SHIPPER | `shipperId` từ phiên | Chỉ đơn của chủ hàng đó | Có |
| `GET /api/shipments/:id` | SHIPPER | So khớp `shipperId` | Chủ hàng khác nhận 403 | Có |
| `GET /api/shipments/:id/location` | SHIPPER | So khớp `shipperId` | Chủ hàng khác nhận 403. Không có route GPS cho nhà xe | Có |
| `GET /api/carrier/shipments` | CARRIER | Đơn `PUBLISHED` và chưa có `carrierId` | Mọi nhà xe đã đăng nhập xem các trường sàn. Không có `shipperId`, email lấy hàng, GPS, hash mật khẩu | Có |
| `GET /api/carrier/shipments/claimed` | CARRIER | `carrierId` từ phiên | Chỉ chuyến nhà xe đó đã nhận | Có, assignment |
| `GET /api/carrier/shipments/:id` | CARRIER | Đơn đang mở hoặc `carrierId` khớp phiên | Nhà xe thua cuộc không đọc chuyến đã có chủ | Có, claim |
| `POST /api/carrier/shipments/:id/claim` | CARRIER | So sánh-và-gán `carrierId` từ phiên | Không nhận danh tính nhà xe từ body | Có |
| `POST /api/carrier/shipments/:id/assign` | CARRIER | Đơn thuộc nhà xe, xe và tài xế thuộc cùng `carrierId` | Nhà xe khác nhận 403 khi dùng xe của chính họ trên đơn không thuộc họ | Có |
| `GET /api/driver/shipments` | DRIVER | `driverId` từ phiên và đã được gán | Không xem chuyến của tài xế khác | Có |
| `GET /api/driver/shipments/:id` | DRIVER | Cùng bộ lọc trên | Id đoán hoặc chuyến người khác trả 404 | Có |
| `POST /api/driver/shipments/:id/pickup` | DRIVER | Tài xế đã gán, trạng thái `MATCHED` | Không nhận `driverId` từ body | Có |
| `POST /api/driver/shipments/:id/delivery` | DRIVER | Tài xế đã gán, đang `IN_TRANSIT` | Gửi lại không tạo thêm mốc | Có |
| `GET/POST /api/driver/shipments/:id/location` | DRIVER | Tài xế đã gán và đang `IN_TRANSIT` khi ghi | Tài xế khác không ghi được | Có |
| `POST /api/carrier/conversations/by-shipment/:id` | CARRIER | `carrierId` từ phiên | Không nhận carrier từ body | Có |
| `GET/POST .../messages` | CARRIER hoặc SHIPPER đúng cuộc | Cuộc trò chuyện thuộc đúng cặp | Nhà xe khác nhận 404 | Có |
| `GET/POST/PATCH /api/carrier/fleet/vehicles` | CARRIER | `carrierId` từ phiên | Nhà xe khác nhận 404 khi đọc hoặc sửa theo id | Có |
| `GET/PATCH /api/carrier/fleet/drivers` | CARRIER | `role: DRIVER` và `carrierId` từ phiên | Không nhận tài xế của nhà xe khác, không đổi role | Có |
| `GET /api/audit` | Không có | — | Tra cứu nhật ký chưa được duyệt | Có, 404 |

Khách chưa đăng nhập nhận 401 trên các route trên. Sai vai trò nhận 403 từ `requireRole` trước khi vào dữ liệu.

## Việc kiểm tra còn giữ từ các lõi trước

IMPLEMENTED và TESTED ở bộ test hiện có, không đổi hợp đồng:

- Claim đồng thời chỉ một nhà xe thành công.
- Chat không nhận chuyến và không đổi giá.
- GPS không xác nhận lấy hàng hay giao hàng.
- Tạo hoặc sửa xe không tự gán xe vào đơn.
- Timeline vẫn là mốc nghiệp vụ nhìn thấy trên đơn, tách khỏi nhật ký backend.

## Khoảng trống đã thấy và chưa bịt bằng chính sách mới

| Khoảng trống | Trạng thái |
| --- | --- |
| ADMIN chưa có quyền vận hành được duyệt để đọc đơn, đội xe, GPS, chat hay nhật ký | BLOCKED / PENDING APPROVAL |
| Sửa đơn và hủy đơn chưa có API vì quyền hủy sau Claim còn mở | BLOCKED / PENDING APPROVAL |
| Tải chứng từ chưa có | BLOCKED / PENDING APPROVAL. Xem mục file trong tài liệu audit |
| `tenant_id` tổ chức chưa tồn tại nên chưa thể ràng buộc mọi query bằng khóa đó | BLOCKED / PENDING APPROVAL |
| Nhà xe thua cuộc vẫn đọc được thread chat đã mở, ở chế độ không gửi. Quy tắc này là tạm thời từ Core 10 và không đổi ở Core 12 | IMPLEMENTED |
| Sàn đang trả số điện thoại và người liên hệ của điểm lấy/giao. Đó là dữ liệu liên hệ của đơn đã đăng, không phải email tài khoản | IMPLEMENTED |
