# Core 14 — Kiểm thử tài khoản tài xế

## Tự động

Cơ sở dữ liệu của suite mới là `coldi_driver_account_test`. Script từ chối chạy nếu tên database khác. Không dùng database `coldi` và không chạy script đặt lại mật khẩu demo.

`server/tests/driverAccount.test.ts` kiểm tra:

1. Nhà xe tạo tài xế. Body có `carrierId`, `role` hoặc mật khẩu tự chọn bị 400.
2. Tài khoản mới có vai trò DRIVER.
3. `carrierId` bằng nhà xe của phiên.
4. Email sai bị 400. Email trùng bị 409.
5. SHIPPER, DRIVER và ADMIN nhận 403 khi tạo.
6. Danh sách, chi tiết và audit không chứa mật khẩu tạm hoặc hash.
7. Nhà xe khác không thấy email đó và nhận 404 ở chi tiết.
8. Mật khẩu tạm đăng nhập được nhưng `GET /api/driver/shipments` trả 403 `password_change_required`.
9. Phân công tài xế chưa đổi mật khẩu trả 409.
10. Đổi mật khẩu thành công thì cookie cũ và mật khẩu tạm hết hiệu lực. Phiên mới xem được danh sách chuyến.
11. Khóa tài xế đang rảnh. Đăng nhập sau đó trả 403. Cookie cũ không còn gọi được `/api/auth/me`.
12. Mở khóa rồi đăng nhập lại bằng mật khẩu hiện tại.
13. Đặt lại mật khẩu trả mật khẩu mới một lần, không trả hash. Mật khẩu cũ và phiên cũ hết hiệu lực. Chuyến vẫn bị chặn cho đến khi đổi mật khẩu.
14. Nhà xe khác đặt lại mật khẩu nhận 404.
15. Khóa và đặt lại mật khẩu trả 409 khi tài xế đang ở đơn MATCHED, và sau Pickup khi đơn IN_TRANSIT. Tài khoản vẫn ACTIVE.
16. Tài xế không có `carrierId` không có trong danh sách, khóa trả 404, phân công trả 400.
17. Tám cặp khóa và phân công đồng thời không để tài xế vừa khóa vừa đứng trên đơn MATCHED hoặc IN_TRANSIT, và không để cả hai lệnh cùng 200.

`server/tests/driverAccountForm.test.ts` gọi hàm thuần của form: tên, email, độ dài mật khẩu, đường dẫn đổi mật khẩu, và việc ẩn tài xế khóa hoặc chưa kích hoạt khỏi phân công. Web không có Vitest hay Playwright. Đây là lớp kiểm tra giao diện nhỏ nhất hiện có. Không phải nghiệm thu trình duyệt.

Các suite Claim, phân công, Pickup, Delivery, Timeline, GPS, chat, đội xe, Marketplace và audit cũ vẫn nằm trong `npm test`. Lần chạy sau khi thêm Core 14: 60 pass, 0 fail. Tile Mapbox không được tính là đã bấm tay.

## Checklist bấm tay — chưa chạy

Dùng tài khoản tạo mới trong buổi kiểm thử. Không dùng hai đơn đã nghiệm thu `6ad25c2fcf4c13c7d5b735dc` và `6ad2fc6b0f1e6b36c1404649`. Không chụp mật khẩu tạm hoặc mật khẩu thật.

1. Nhà xe mở `/carrier/doi-xe/tai-xe` ở 390px và ở desktop. Tạo tài xế với tên và email hợp lệ.
2. Mật khẩu tạm hiện một lần và sao chép được. Đóng khung thì không còn thấy. Tải lại trang không làm mật khẩu hiện lại.
3. Email sai và email trùng có báo lỗi. Không tạo được khi đang gửi.
4. Đăng xuất nhà xe. Tài xế đăng nhập bằng mật khẩu tạm và vào `/driver/doi-mat-khau`, không thấy danh sách chuyến trước đó.
5. Mật khẩu ngắn hơn 8 ký tự bị từ chối. Mật khẩu hợp lệ đưa tài xế vào khu chuyến. Mật khẩu tạm không đăng nhập được nữa.
6. Khóa tài xế đang rảnh. Tài xế không đăng nhập được. Mở khóa thì đăng nhập được.
7. Phân công tài xế đó vào đơn MATCHED. Khóa và đặt lại mật khẩu đều báo chuyến chưa kết thúc. Đơn và phân công không đổi.
8. Sau giao hàng, đặt lại mật khẩu được. Mật khẩu mới chỉ hiện một lần.
9. Nhà xe thứ hai không thấy tài xế này trong danh sách của mình.
10. Logout vẫn bấm được trên màn đổi mật khẩu.

Chưa có kết quả PASS cho checklist này.
