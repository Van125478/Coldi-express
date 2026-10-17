# Core 13 — Kiểm thử sàn tìm chuyến

Ngày ghi: 2026-10-17. Cơ sở dữ liệu phát triển `coldi` không bị script này kết nối. Test dùng `coldi_marketplace_test` và các database test cũ, rồi từ chối nếu tên database lệch.

## Tự động

Toàn bộ server: 45 tests, 45 pass, 0 fail.

`server`: `npm run lint`, `npm test`, `npm run build` đều qua. `tsc --noEmit` qua trước vòng test đầy đủ.

`web`: `npm run lint`, `npx tsc -b`, `npm run build` đều qua.

Web chưa có runner test giao diện. Hành vi tìm, lọc, so sánh và popup Claim trên trình duyệt nằm ở phần nghiệm thu tay bên dưới.

### `tests/marketplace.test.ts`

1. Load Board chỉ trả đơn `PUBLISHED` chưa có nhà xe, kể cả đơn thiếu tải trọng. Đơn thiếu số không bị bịa tải trọng.
2. JSON không có email riêng, `shipperId`, `latitude`, `longitude`, `passwordHash`, `latestLocation`.
3. Đọc danh sách không thêm Timeline event và không thêm audit.
4. Tìm ` thủy sản c13 ` khớp một đơn. Tìm không dấu `thuy san c13` không khớp.
5. Lọc điểm lấy, nhóm nhiệt, tải trọng và ngày lấy đúng đơn.
6. Mới đăng trả đơn tạo sau trước. Giá bằng nhau thì `_id` tăng dần, giá cao hơn đứng sau.
7. Nhiệt sai, `tenantId`, khoảng tải trọng ngược và `sort=nearest` trả 400.
8. Chủ hàng, tài xế, quản trị nhận 403. Khách nhận 401. Tài xế Claim nhận 403 và đơn vẫn `PUBLISHED`.
9. Mở chat và `POST /bookmark` không Claim. Bookmark trả 404.
10. Hai nhà xe Claim cùng lúc: đúng một 200, một 409, một audit thành công, đơn biến mất khỏi sàn.

Các test Claim, chat, GPS, đội xe, timeline và security trước đó vẫn pass.

## Sửa giữ việc cũ, phát hiện khi biên dịch

Các mục này không phải tính năng sàn mới. Working tree đang thiếu phần khiến lint hoặc test Core 09/11/FE-01 không còn khép:

- `GET /api/shipments/:id/location` được import nhưng handler không còn. Đã gắn lại cho đúng chủ hàng: chủ đơn 200, chủ hàng khác 403, vai trò khác bị chặn bởi role.
- `assignShipment` mất chữ ký hàm. Đã khôi phục lời gọi phân công cũ.
- `main.tsx` import `AppProviders` nhưng vẫn render `AuthProvider` không import. Đã bọc bằng `AppProviders`.
- Nav nhà xe import `Container` nhưng chưa có Đội xe. Đã thêm lối vào `/carrier/doi-xe`.
- Chi tiết tài xế import chia sẻ vị trí nhưng không render. Đã gắn lại khi chuyến `IN_TRANSIT`.

## Nghiệm thu tay — chỉ chuẩn bị, chưa chạy

Không tạo đơn và không Claim trên database phát triển. Không đụng đơn `6ad25c2fcf4c13c7d5b735dc` và `6ad2fc6b0f1e6b36c1404649`.

Đăng nhập nhà xe demo. Dùng đơn PUBLISHED sẵn có. Nếu sàn trống, dừng và không tự niêm yết đơn mới trong lượt nghiệm thu này.

A. Mở `/carrier`. Thấy ô tìm, Tìm chuyến, Quản lý xe, Chuyến của tôi. Không có nút giá dầu hay tiệm sửa xe bấm được.

B. Mở `/carrier/tim-chuyen`. Chỉ thấy đơn đang tìm xe. Đơn đã nhận không nằm trong feed.

C. Tìm một tên hàng hoặc một đoạn điểm lấy có thật. Xóa ô và áp dụng lại thì danh sách trở về.

D. Lọc một nhóm nhiệt. Số kết quả đổi theo đơn thật.

E. Nhập tải trọng từ lớn hơn tải trọng đến. Trang báo lỗi và không gửi lọc sai. Với khoảng hợp lệ, đơn thiếu tải trọng không xuất hiện.

F. Đổi sắp xếp Mới đăng, thời gian lấy, giá, tải trọng. Không có mục gần nhất hay phù hợp nhất.

G. Bấm So sánh trên hai đơn. Bảng tạm hiện tuyến, hàng, nhiệt, tải, lịch, xe, cước. Tải lại trang thì mất chọn. Trạng thái đơn không đổi.

H. Mở chi tiết. Thấy hàng, tuyến, nhiệt, khối lượng nếu có, xe yêu cầu, cước niêm yết.

I. Nhắn chủ hàng. Quay lại danh sách, đơn vẫn đang tìm xe.

J. Bấm Nhận chuyến, rồi Để sau. Không có thông báo thành công.

K. Bấm Nhận chuyến, rồi Xác nhận nhận chuyến. Chỉ sau phản hồi mới thấy thành công.

L. Nếu đơn đã bị nhà xe khác nhận, thấy thông báo xung đột, không thấy thông báo thành công.

M. Đơn vừa nhận không còn trong feed đang mở.

N. Từ chuyến đã nhận, đi tiếp Phân công xe và tài xế. Chưa có xe và tài xế tự gán.

O. Xem `/carrier/tim-chuyen` ở rộng 390px và trên desktop. Không có thanh cuộn ngang. Nút chạm không bị footer che.

P. Trong payload danh sách không thấy tọa độ GPS, nội dung chat, audit, email tài khoản hay `shipperId`.

## Chưa làm

Lưu chuyến theo tài khoản, khoảng cách, ETA, bản đồ, giá dầu, gara, công nợ, tạm ứng, VAT và thanh toán vẫn ngoài phạm vi.
