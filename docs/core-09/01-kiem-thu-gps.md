# Kiểm thử tay Core 09 — GPS

Tài liệu này dành cho buổi bấm tay khi người kiểm thử quay lại. Chưa chạy buổi đó. Không commit phần này cùng với mã cho đến khi nghiệm thu.

Không dùng hai đơn đã nghiệm thu:

- `6ad25c2fcf4c13c7d5b735dc`
- `6ad2fc6b0f1e6b36c1404649`

Tạo một đơn mới. Không gửi tọa độ thật trong ảnh chụp hoặc tin nhắn. Che vĩ độ và kinh độ nếu màn hình hiện số.

## Phân biệt hai loại kiểm thử

Test API trong `server/tests/gps.test.ts` dùng tọa độ cố định và cơ sở dữ liệu `coldi_gps_test`. Đó không phải vị trí thiết bị thật.

Buổi bấm tay dùng vị trí trình duyệt trên chuyến mới. Không có bản đồ nền. Goong.io và Mapbox chưa được chọn.

## Các bước

1. Chủ hàng đăng một đơn mới. Không sửa đơn cũ.
2. Nhà xe nhận chuyến, rồi phân công xe demo và tài xế demo.
3. Tài xế mở chi tiết chuyến. Nút chia sẻ vị trí chưa hiện khi trạng thái còn “Chờ lấy hàng”.
4. Tài xế xác nhận đã lấy hàng. Trạng thái thành “Đang vận chuyển”. Việc này không cần GPS.
5. Tài xế bấm “Bắt đầu chia sẻ vị trí”. Trình duyệt hỏi quyền. Chấp nhận.
6. Khi gửi thành công, trang tài xế hiện thời điểm máy chủ nhận.
7. Chủ hàng mở đúng đơn đó. Mục “Vị trí GPS” hiện “Đang vận chuyển — vị trí mới cập nhật”, tọa độ và thời điểm. Không gọi mốc này là Live nếu dòng chữ nói vị trí đã cũ.
8. Tắt quyền vị trí hoặc từ chối quyền. Tài xế vẫn xác nhận giao hàng được. Không có tọa độ giả.
9. Để trang chủ hàng mở quá 20 phút sau lần nhận cuối, hoặc chờ đến khi máy chủ trả phase cũ. Dòng trạng thái phải là “Đang vận chuyển — vị trí cập nhật đã lâu”, không phải vị trí trực tiếp.
10. Nếu API tắt, chủ hàng thấy “Không thể tải vị trí” và nút “Thử lại”.
11. Tài xế xác nhận đã giao hàng. Mục vị trí chuyển sang “Đã xác nhận giao hàng — ngừng theo dõi trực tiếp”. Nút chia sẻ không còn gửi.
12. Timeline vẫn chỉ có năm mốc: đã đăng, nhà xe nhận, phân công, lấy hàng, giao hàng. Không có mốc GPS. Trạng thái không thành “Hoàn tất” và không thành thanh toán.

## Giới hạn đã biết

- Chỉ gửi khi trang chuyến đang mở và ở trước màn hình. Ẩn trang thì dừng. Đóng trình duyệt thì không còn gửi.
- Địa chỉ kho là chữ. Không có kiểm tra “cách kho dưới 5 km”.
- Tốc độ không có thì máy chờ theo mốc 15 phút, trừ khi tọa độ hợp lệ cho thấy đã đi thêm hơn 2 km.
- Tốc độ dưới 5 km/h thì khoảng 15 phút. Từ 5 km/h thì khoảng 4 phút, hoặc sớm hơn khi đi thêm hơn 2 km.
- Nhà xe không có mục vị trí. v2.3 mô tả Live Map cho chủ hàng, chưa chốt nhà xe được xem tọa độ.
- Chưa có thời hạn xóa vị trí. Hệ thống chỉ giữ vị trí mới nhất trên đơn, không giữ lịch sử lộ trình.
