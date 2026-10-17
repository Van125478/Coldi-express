# MVP-02 — Sẵn sàng nghiệm thu tay

> Historical Snapshot. Câu “Core 09–13 chưa commit” bên dưới là lúc viết file. Mã logistics hiện nằm trên nhánh team testing. Trạng thái mới: [MVP_STATUS_2026-10-18.md](MVP_STATUS_2026-10-18.md). E2E trình duyệt vẫn chưa nghiệm thu.

Nghiệm thu tay lúc viết file: NOT RUN.

API đã đi hết chuỗi bốn vai trò trên database `coldi_integration_test`. Việc còn lại là bấm trên trình duyệt với dữ liệu local, không dùng hai đơn đã nghiệm thu `6ad25c2fcf4c13c7d5b735dc` và `6ad2fc6b0f1e6b36c1404649`.

## Điều kiện trước khi bấm

- MongoDB local đang chạy. API `http://127.0.0.1:4000`. Web `http://127.0.0.1:5173`. Không dùng `localhost`.
- Máy mới cần `seed:demo` rồi `seed:fleet` trên database của máy đó. Máy đã có dữ liệu cần giữ thì không seed lại.
- Không chạy `reset:demo-passwords` trong lượt nghiệm thu.
- Core 09–13 vẫn chưa commit. Người nghiệm thu phải dùng cây làm việc này, không dùng bản clone của HEAD `69ec1a1`.
- README gốc chưa được sửa. Nó vẫn mô tả bản đã commit, chưa gồm GPS, chat và đội xe.

## Việc API đã chứng minh, không cần bấm lại để tin backend

Đăng đơn, tìm trên sàn, chat không đổi giá và không Claim, một nhà xe thắng, gán xe và tài xế liên kết, lấy hàng, GPS, giao hàng, năm mốc timeline, và audit success. Chi tiết nằm ở `06-integration-test-results.md`.

## Checklist trình duyệt

Đánh dấu từng dòng khi bấm. Chưa có dòng nào được đánh dấu trong lượt này.

1. Khách mở `/carrier/tim-chuyen` thì ra trang đăng nhập.
2. Chủ hàng đăng nhập, tạo một đơn mới. Không sửa hai đơn đã nghiệm thu.
3. Nhà xe mở `/carrier`, tìm đúng tên hàng, thấy đơn trên `/carrier/tim-chuyen`.
4. Lọc nhóm nhiệt. Xóa bộ lọc. Đơn vẫn đang tìm xe.
5. Mở Nhận chuyến rồi bấm Để sau. Đơn không biến mất khỏi sàn.
6. Nhắn chủ hàng. Chủ hàng thấy tin và trả lời. Đơn vẫn đang tìm xe.
7. Bấm Xác nhận nhận chuyến. Chỉ sau phản hồi mới thấy thành công. Vào phân công. Chưa có xe hay tài xế tự gán.
8. Chọn xe và tài xế của nhà xe. Nhãn vận hành là “Chờ lấy hàng”. Status không sang đang chạy.
9. Tài xế đăng nhập, thấy đúng chuyến, bấm xác nhận lấy, rồi xác nhận trong panel.
10. Trang tài xế hiện chia sẻ vị trí. Từ chối quyền vị trí vẫn không chặn bước giao.
11. Chủ hàng mở đơn, thấy phase và thời điểm GPS. Không kỳ vọng bản đồ.
12. Tài xế xác nhận giao. Chữ trên màn nói việc này chưa phải thanh toán.
13. Nhà xe không còn thấy đơn trong sàn đang mở.
14. Mở Đội xe, sửa tên một xe đã gán sau MVP-03. Quay lại timeline của chuyến đó: câu phân công giữ tên lúc gán. Đơn tạo trước khi có snapshot vẫn có thể hiện tên hiện tại.
15. Xem sàn ở rộng 390px và trên desktop. Không có thanh cuộn ngang. Popup Claim không bị khuất nút xác nhận.

## Chưa chặn chuỗi, nhưng chưa được gọi là xong

- Bản đồ Mapbox GL JS đã có trong mã. Tile và marker thật chưa được bấm. Checklist ở `09-mapbox-live-map.md`.
- Audit có thể mất nếu process chết giữa ghi đơn và ghi log.
- Nhà xe thua vẫn đọc thread cũ là quy tắc tạm.
- Không có tenant tổ chức, không có mời tài xế, không có xóa xe, không có thanh toán.

## Chặn phát hành cho đồng đội

Clone HEAD hoặc `main` chưa chứa Core 09–13. Nghiệm thu tay trên cây này không làm bản GitHub trở thành bản đồng đội chạy được. Việc commit và sửa README thuộc bước đóng gói sau, khi được yêu cầu.
