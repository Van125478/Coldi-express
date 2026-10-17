# Kiểm thử bảo mật Core 12

Kiểm thử tự động dùng database `coldi_security_test`. Không đụng database phát triển `coldi`. Không chạy seed.

## Đã chạy tự động — TESTED

`server/tests/security.test.ts` kiểm tra:

- Khách nhận 401 với đơn của chủ hàng, đội xe và chuyến tài xế.
- Chủ hàng khác nhận 403 khi đọc đơn riêng.
- Nhà xe khác nhận 404 khi đọc hoặc sửa xe.
- Tài xế khác nhận 404 với chuyến đã gán.
- ADMIN nhận 403 với sàn nhà xe.
- Shipper và Driver nhận 403 với đội xe.
- `tenantId`, `shipperId`, `carrierId`, `senderId` trong body không đổi định danh đã đăng nhập.
- Id không hợp lệ trả 404.
- Sàn không chứa email lấy hàng riêng, `shipperId`, GPS, hash mật khẩu hay chữ audit.
- Claim hợp lệ vẫn tạo một nhà xe thắng.
- Nhà xe thua không gán được xe của họ vào đơn đã có chủ.
- Claim đồng thời chỉ tạo một dòng `SHIPMENT_CLAIMED` thành công.
- Gửi lại xác nhận lấy hàng không tạo dòng nhật ký thứ hai.
- GPS không thành mốc và tọa độ không nằm trong nhật ký.
- Chat không đổi trạng thái đơn. Nội dung tin không nằm trong nhật ký. Nhà xe khác không đọc được tin.
- Tạo và sửa xe không đổi `vehicleId` của đơn đã gán.
- Đổi tên tài xế không đổi role hay nhà xe.
- Không có API đọc nhật ký.

Bộ `npm test` sau Core 12: 42 passed, 0 failed. Mốc trước Core 12 là 39 passed, 0 failed. Ba test mới nằm trong `security.test.ts`. GPS, chat và đội xe vẫn trong cùng lệnh.

## Nghiệm thu thủ công để làm sau

Chưa thực hiện trong Core 12. Không tạo đơn mới trên database phát triển khi làm các bước này cho đến khi được yêu cầu.

1. Đăng nhập chủ hàng A và nhà xe A. Đăng một đơn thử, tên hàng ghi rõ “Core 12”. Xác nhận đơn xuất hiện trên sàn của nhà xe B với các trường liên hệ đã công khai, và chủ hàng B không mở được chi tiết đơn đó.
2. Nhà xe A nhận chuyến. Nhà xe B không còn thấy đơn trên sàn và không gán được xe.
3. Nhà xe A gán xe demo sẵn có và tài xế đã liên kết. Trạng thái vận hành vẫn là Chờ lấy hàng.
4. Tài xế khác tài khoản không mở được chuyến. Tài xế được gán xác nhận lấy hàng rồi giao hàng.
5. Gửi vị trí GPS và một tin chat trên đơn thử. Xác nhận Timeline chỉ có các mốc nghiệp vụ cũ, không có mốc GPS hay chat.
6. Sửa tên xe sau khi đã gán. Đơn vẫn trỏ cùng xe. Câu Timeline có thể đổi theo tên hiện tại. Đó là điểm đã ghi ở Core 11, không phải việc của nhật ký.
7. Không xóa đơn Core 06 `6ad25c2fcf4c13c7d5b735dc` và đơn Core 07 `6ad2fc6b0f1e6b36c1404649`.

Nhật ký hiện không có màn hình tra cứu. Kiểm tra bản ghi chỉ thực hiện trên database test, không truy vấn database phát triển để đọc nhật ký.
