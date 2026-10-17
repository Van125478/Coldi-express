# Kiểm thử tay Core 11 — Đội xe

Chưa chạy buổi bấm tay. Không tạo xe hoặc sửa tài xế trên cơ sở dữ liệu development trong lúc cài đặt.

Không dùng hai đơn đã nghiệm thu `6ad25c2fcf4c13c7d5b735dc` và `6ad2fc6b0f1e6b36c1404649`.

## Phạm vi đã làm

Nhà xe đăng nhập xem, thêm và sửa xe của mình. Trường lưu: tên xe, biển số, loại phương tiện, nhóm nhiệt, tải trọng tấn. Xe cũ chỉ có tên vẫn hiện trong danh sách và vẫn phân công được.

Tài xế: xem danh sách tài xế đã liên kết và sửa tên hiển thị. Không tạo tài khoản, không đổi nhà xe, không hiện mật khẩu.

Không có xóa xe, ngừng xe, đăng kiểm, hạn đăng kiểm, máy lạnh hay bảo dưỡng. Những mục đó là đề xuất D-07, không chặn phân công.

Thêm hoặc sửa xe không nhận chuyến, không đổi timeline, không đổi GPS và không đổi chat.

## API

- `GET` và `POST /api/carrier/fleet/vehicles`
- `GET` và `PATCH /api/carrier/fleet/vehicles/:id`
- `GET /api/carrier/fleet/drivers`
- `GET` và `PATCH /api/carrier/fleet/drivers/:id`

Biển số từ 2 đến 20 ký tự, không kiểm tra trùng toàn hệ thống. Tải trọng lớn hơn 0, không quá 100 tấn, tối đa 3 số lẻ. Loại xe là Xe tải lạnh, Container lạnh hoặc Xe van lạnh theo form prototype, không phải phân loại pháp lý.

## Màn hình

`/carrier/doi-xe`, thêm xe, chi tiết, sửa xe, `/carrier/doi-xe/tai-xe` và hồ sơ tài xế.

## Bấm tay sau

1. Đăng nhập nhà xe. Mở Đội xe.
2. Thấy xe demo nếu máy đã chạy seed đội xe.
3. Mở chi tiết xe đó.
4. Thêm một xe mới, tên rõ là xe kiểm thử. Chỉ coi là thành công khi trang chi tiết hiện “Đã lưu xe”.
5. Tải lại và sửa một trường được phép.
6. Nhận một đơn mới, rồi phân công. Danh sách xe phải có xe vừa thêm. Trạng thái vẫn chờ lấy hàng.
7. Mở danh sách tài xế đã liên kết. Không có nút tạo tài xế.
8. Xác nhận timeline không có mốc đội xe.
9. Nếu có nhà xe thứ hai an toàn, nhà xe đó không mở được xe của nhà xe kia.

Test API nằm ở `server/tests/fleet.test.ts`, cơ sở `coldi_fleet_test`.
