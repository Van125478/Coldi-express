# Nhật ký backend Core 12

Timeline trên đơn và nhật ký backend là hai thứ khác nhau.

Timeline, IMPLEMENTED từ Core 07, là các mốc chủ hàng, nhà xe và tài xế nhìn thấy trên chuyến. Nhật ký backend là bản ghi ai đã thực hiện một thao tác đã thành công và vào lúc nào. Nhật ký không thay Timeline. Timeline không được dùng làm nhật ký bảo mật.

## Sự kiện đang ghi — IMPLEMENTED

| Hành động | Khi nào ghi | Dữ liệu |
| --- | --- | --- |
| `SHIPMENT_PUBLISHED` | Sau khi tạo đơn thành công | Actor, đơn, trạng thái sau |
| `SHIPMENT_CLAIMED` | Sau khi compare-and-set Claim thành công | Actor, đơn, `PUBLISHED` → `MATCHED`, tài khoản nhà xe |
| `SHIPMENT_ASSIGNED` | Sau khi gán xe và tài xế thành công | Actor, đơn, trạng thái vẫn `MATCHED`, tài khoản nhà xe |
| `SHIPMENT_PICKUP_CONFIRMED` | Chỉ khi lệnh cập nhật lấy hàng thực sự ghi được | `MATCHED` → `IN_TRANSIT` |
| `SHIPMENT_DELIVERY_CONFIRMED` | Chỉ khi lệnh cập nhật giao hàng thực sự ghi được | `IN_TRANSIT` → `DELIVERY_CONFIRMED` |
| `VEHICLE_CREATED` | Sau khi tạo xe thành công | Actor, xe, tên các trường đã ghi, tài khoản nhà xe |
| `VEHICLE_UPDATED` | Sau khi sửa xe thành công | Tên trường, không ghi giá trị biển số vào nhật ký riêng ngoài document xe |
| `DRIVER_PROFILE_UPDATED` | Sau khi đổi tên hiển thị tài xế thành công | Chỉ tên trường `displayName` |

`relatedCarrierId` là id tài khoản CARRIER đã có trên phiên hoặc trên đơn. Đó không phải `tenant_id` của một doanh nghiệp.

Mỗi bản ghi có `outcome: "success"`, `occurredAt` do server tạo, và `correlationId` nếu header `x-request-id` chỉ gồm 1–64 ký tự an toàn. Cookie và token không được chép vào nhật ký.

Không ghi tọa độ GPS, nội dung chat, mật khẩu, hash mật khẩu, hay cookie.

## Việc chưa ghi

| Việc | Trạng thái |
| --- | --- |
| Sửa đơn | BLOCKED / PENDING APPROVAL. Chưa có API sửa |
| Hủy đơn | BLOCKED / PENDING APPROVAL. Quyền hủy còn mở |
| Dòng nhật ký cho thao tác thất bại | PROPOSED. Hiện thất bại được biểu diễn bằng việc không có dòng success |
| GPS và chat | Không ghi. GPS không phải mốc nghiệp vụ. Chat không nhận chuyến |
| Chống sửa, chống xóa, thời hạn lưu, màn tra cứu | BLOCKED / PENDING APPROVAL theo mục 7.2 |
| API đọc nhật ký cho ADMIN | BLOCKED / PENDING APPROVAL. `GET /api/audit` không tồn tại |

## Bảo đảm ghi

MongoDB đang dùng là standalone. Core 12 không giả định multi-document transaction.

Claim, phân công, lấy hàng và giao hàng vẫn là một `findOneAndUpdate` có điều kiện trên chính document đơn, kèm Timeline trong cùng pipeline. Nhật ký là collection `AuditLog`, ghi sau khi lệnh đó trả về document đã đổi.

IMPLEMENTED: handler chỉ gọi ghi nhật ký sau khi ghi nghiệp vụ thành công. Claim thua cuộc không đi qua nhánh đó. Gửi lại lấy hàng hoặc giao hàng khi mốc đã có trả về thành công nghiệp vụ nhưng không tạo thêm dòng nhật ký, vì lệnh cập nhật không khớp nữa.

Chỉ số unique một phần trên `action + resourceId` áp dụng cho năm hành động một lần của đơn. Nếu lần ghi nhật ký bị lặp, lỗi trùng khóa bị nuốt và không tạo dòng thứ hai.

IMPLEMENTED: lỗi ghi nhật ký khác không làm hỏng phản hồi của thao tác đã thành công. Driver vẫn nhận kết quả lấy hàng hoặc giao hàng. Claim đã thắng không bị đảo.

## Cửa sổ còn lại

| Tình huống | Hậu quả |
| --- | --- |
| Đơn hoặc xe đã ghi xong, process dừng trước khi insert nhật ký | Thao tác nghiệp vụ còn, dòng nhật ký mất. Gửi lại mốc một lần không tạo lại dòng vì trạng thái đã đổi |
| Hai request sửa xe cùng nội dung đều được MongoDB ghi | Hai dòng `VEHICLE_UPDATED`. Sửa xe không có khóa idempotency đã duyệt |
| Nhật ký và đơn không cùng transaction | Không thể cam kết hai bên cùng commit hoặc cùng rollback |
| Có người sửa collection trực tiếp trong database | Chưa có cơ chế chống sửa. Không được mô tả nhật ký là tamper-proof |

## File và chứng từ — BLOCKED / PENDING APPROVAL

Chưa có upload, download, S3 hay MinIO. Core 12 không xây hệ thống file.

Khi được duyệt sau này, quyền xem file phải kiểm tra cùng quan hệ với đơn hoặc chuyến: chủ hàng sở hữu đơn, nhà xe đã nhận, hoặc tài xế được gán. Không phát URL công khai không hết hạn. Metadata cần người tải, thời điểm, loại chứng từ và id đơn. `tenant_id` chỉ thêm khi mô hình tổ chức đã được duyệt. Dung lượng, định dạng, quét mã độc và thời hạn xóa vẫn chờ quyết định ở mục 7.3.
