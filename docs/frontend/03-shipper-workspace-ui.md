# FE-03 — Giao diện khu Chủ hàng

Ngày ghi: 17/10/2026. Nhánh `integration/coldi-v2.3-mvp`, xuất phát từ `fd352e8` sau FE-02. Người dùng chưa nghiệm thu hình ảnh.

## Ảnh đã xem

- `Asset/coldi/Coldi Freight - Home Screen (Role Chủ Hàng) Pro Max.png`: lời chào, đơn đang theo dõi, lối tắt đăng đơn và quản lý đơn.
- `Asset/coldi/Coldi Freight - Quản lý đơn hàng (Badge Chuẩn & Balanced Cards).png`: tìm kiếm, nhóm trạng thái, thẻ tuyến và giá.
- `Asset/coldi/Coldi Freight - Chi tiết đơn hàng #1030 (Khôi phục Route & Chuẩn B2B).png`: lộ trình lấy/giao, yêu cầu xe và hàng, giá niêm yết.
- Form tạo đơn đã có ba bước Điểm bốc, Điểm giao, Hàng hóa và xe. Ảnh bước 1 không mở được vì tên file; bước đang chạy trong code được giữ.

Các mục prototype bị bỏ: xe gần đây, đánh giá, khoảng cách, ETA, phần trăm tiến độ, VAT, công nợ, hủy đơn, sửa đơn, chứng từ, và nút đặt xe. Chủ hàng niêm yết; nhà xe tự nhận.

## Ánh xạ

| Màn | Route | Việc đã làm |
| --- | --- | --- |
| Trang chủ | `/shipper` | Lời chào, đăng đơn, đơn đang theo dõi khi có chuyến thật, nhóm theo trạng thái |
| Tạo đơn | `/shipper/tao-don` | Giữ ba bước và validation. Đánh dấu trường bắt buộc. Nhóm nhiệt là Lạnh mát, Đông, Cực lạnh |
| Quản lý đơn | `/shipper/don-hang` | Tìm trên danh sách đã tải, lọc Đang tìm xe / Đã nhận / Đang chạy / Đã giao |
| Chi tiết | `/shipper/don-hang/:id` | Tuyến, hàng, giá, phân công khi đã gán, GPS, chat, lịch sử |
| Chat | trong chi tiết | Danh sách cuộc trao đổi, trạng thái trống, thử lại khi lỗi |
| GPS | `#vi-tri` | Giữ Mapbox hiện có. Không vẽ tuyến giả |
| Timeline | trong chi tiết | Giữ năm mốc Core 07 |

## Layout dùng chung

Shipper dùng `WorkspaceLayout`, logo theo vai trò và header hiện có. Sidebar nhà xe vẫn tối. Sidebar chủ hàng vẫn sáng. Nhãn điều hướng chủ hàng là Trang chủ, Tạo đơn, Quản lý đơn. Không thêm router mới và không đổi trang công khai.

## Cố ý không làm

Không lưu nháp. Không tạo đơn trên cơ sở dữ liệu phát triển khi kiểm thử. Không đổi luật đăng đơn. Không tự chuyển COMPLETED. Không hiện nhà xe trước khi nhận, và không hiện tài xế trước khi phân công. Chat không nhận chuyến. GPS không xác nhận lấy hoặc giao.

## Kiểm thử tự động

`server/tests/shipperGroups.test.ts` kiểm nhóm trạng thái và đơn đang theo dõi. Sau sửa:

- Server: `npm test` 64 pass, 0 fail; typecheck, lint, build pass.
- Web: lint, `tsc -b`, production build pass.

Web không có trình chạy test giao diện.

## Trình duyệt đã xem

Đăng nhập chủ hàng demo, chỉ đọc. Không bấm hoàn tất đăng đơn, không gửi chat.

- `/shipper` tại 1440, 768 và 390 không tràn ngang. Logo trỏ `/shipper`.
- Tạo đơn: bấm tiếp khi trống hiện lỗi, vẫn ở bước 1, không gửi API đăng đơn.
- Quản lý đơn: lọc Đã giao hiện đúng số đơn đã tải.
- Chi tiết một đơn đã phân công: tuyến, giá, xe, tài xế, khối GPS “chưa bắt đầu vận chuyển”, chat và lịch sử. Không có VAT.
- Tile Mapbox chưa được mở. Bản đồ thật vẫn NOT VERIFIED.

## Chưa xem

Chưa đăng một đơn mới trên trình duyệt. Chưa gửi tin. Chưa mở bản đồ khi có tọa độ và khóa Mapbox công khai. Chưa đối chiếu từng pixel với ảnh điện thoại prototype.
