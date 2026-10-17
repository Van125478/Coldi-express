# FE-04 — Giao diện khu Tài xế

Ngày ghi: 17/10/2026. Nhánh `integration/coldi-v2.3-mvp`, xuất phát từ `a5d5469` sau FE-03. Người dùng chưa nghiệm thu hình ảnh.

## Ảnh đã xem

- `Asset/coldi/Coldi Driver — Trang chủ - 2026-10-14T07_58_30.305Z.png`: lời chào, ba số liệu, chuyến được phân công, thẻ tuyến, việc xem chi tiết.
- `Asset/coldi/Coldi Freight - GPS Live Tracking Đơn #1028 (Fixed Icons & Typography).png`: màn theo dõi của phía xem chuyến, có tuyến vẽ, ETA, phần trăm, đánh giá, công nợ và chứng từ.

Không thấy ảnh riêng cho danh sách chuyến tài xế, popup lấy/giao, hoặc đổi mật khẩu lần đầu. Những màn đó đi từ luồng đang chạy và ảnh trang chủ tài xế.

Các mục prototype bị bỏ: thanh dưới Thông báo và Tài khoản, chuông, ETA, tuyến giả, phần trăm, vận tốc, đánh giá, công nợ, chứng từ, và nút nhận chuyến. Tài xế không mở sàn.

Báo cáo kiểm kê `docs/COLDI_v2.4_Screen_Route_Audit_fd352e8.md` được đối chiếu với source sau FE-03. Các route tài xế đã có trước FE-04.

## Ánh xạ

| Màn | Route | Việc đã làm |
| --- | --- | --- |
| Trang chủ | `/driver` | Lời chào bằng email thật, ba số đếm từ chuyến đã gán, một chuyến đang cần làm |
| Chuyến của tôi | `/driver/chuyen` | Thẻ tuyến, tìm trên danh sách đã tải, lọc Chờ lấy hàng / Đang vận chuyển / Đã giao |
| Chi tiết | `/driver/chuyen/:id` | Xác nhận đặt trước phần lộ trình trên điện thoại, hàng, xe, GPS, lịch sử |
| GPS | trong chi tiết | Giữ Geolocation và luật gửi hiện có. Nói rõ chưa mở, đang chia sẻ, hoặc đã dừng sau giao |
| Đổi mật khẩu tạm | `/driver/doi-mat-khau` | Hiện quy tắc 8–72 ký tự, nhập lại, và chặn gửi khi chưa khớp. Tài khoản đã kích hoạt bị đưa về trang chủ |
| Timeline | trong chi tiết | Giữ năm mốc Core 07 |

Nhãn Đã giao là cách đọc `DELIVERY_CONFIRMED`. Không tạo trạng thái COMPLETED.

## Layout dùng chung

Tài xế dùng `WorkspaceLayout`, logo theo vai trò và header hiện có. Sidebar tài xế vẫn sáng. Nhãn vẫn là Trang chủ và Chuyến của tôi. Logo trong khu làm việc trỏ `/driver`. Không thêm router mới, không thêm thanh điều hướng dưới, và không đổi trang công khai, chủ hàng, hoặc nhà xe.

## Cố ý không làm

Không xác nhận lấy hoặc giao từ trang chủ. Không gọi API xác nhận khi chỉ mở hộp thoại. Không bắt đầu GPS khi mở trang. Không suy mốc từ GPS. Không cho tài xế nhận chuyến, đổi xe, hoặc xem chuyến của nhà xe khác. Không thêm hồ sơ, thông báo, kho, hoặc chứng từ.

## Kiểm thử tự động

`server/tests/driverLanes.test.ts` kiểm nhóm trạng thái, chuyến đang cần làm, và thứ tự danh sách. Sau sửa:

- Server: `npm test` 66 pass, 0 fail; typecheck, lint, build pass.
- Web: lint, `tsc -b`, production build pass.

Web không có trình chạy test giao diện.

## Trình duyệt đã xem

Đăng nhập tài xế demo, chỉ đọc. Có đăng xuất phiên chủ hàng đang mở trước đó. Không bấm ghi nhận lấy hàng, không bấm giao hàng, không bấm bắt đầu chia sẻ vị trí, không đổi mật khẩu.

- `/driver` tại 1440 và 390 không tràn ngang. Logo trỏ `/driver`. Số liệu là 4 chờ lấy, 0 đang chạy, 2 đã giao, lấy từ danh sách thật.
- `/driver/chuyen` tại 1280 không tràn ngang. Lọc Đã giao còn 2 chuyến và nút lọc ở trạng thái pressed.
- Chi tiết một chuyến chờ lấy: việc tiếp theo là xác nhận lấy hàng, GPS ghi Chưa mở, lịch sử giữ mốc đã đăng. Trên 390, khối xác nhận nằm trước lộ trình và không tràn ngang. Mở câu hỏi ghi nhận rồi bấm Hủy. Trạng thái vẫn là chờ lấy hàng.
- `/driver` tại 768 không tràn ngang.
- Tài khoản đã kích hoạt vào `/driver/doi-mat-khau` thì được đưa về `/driver`.

## Chưa xem

Chưa xác nhận lấy hàng hoặc giao hàng trên trình duyệt. Chưa cấp quyền GPS và chưa gửi tọa độ. Chưa thấy màn đổi mật khẩu với một tài khoản còn mật khẩu tạm. Chưa thấy chuyến đang vận chuyển nên chưa thấy nút dừng chia sẻ trên trình duyệt. Tile Mapbox không thuộc màn tài xế này. Chưa đối chiếu từng pixel với ảnh điện thoại prototype.
