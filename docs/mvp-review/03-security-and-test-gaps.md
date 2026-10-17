# MVP-01 — Bảo mật và khoảng trống test

Không có lỗ đọc chéo nào được xác nhận thêm ngoài những ca đã bị test từ chối. Thiếu `tenant_id` là khoảng trống mô hình, không phải một vụ lộ dữ liệu đã tái hiện trong mã.

## Phân quyền đã thấy trong mã

| Việc | Kết quả trong mã | Test |
| --- | --- | --- |
| Chủ hàng khác xem đơn | 403 ở `GET /api/shipments/:id` | `shipment.test.ts`, `security.test.ts` |
| Chủ hàng khác xem GPS | 403 ở `GET /api/shipments/:id/location` | `gps.test.ts`, `security.test.ts` |
| Nhà xe khác xem đội xe | 404/403 theo route fleet | `fleet.test.ts` |
| Tài xế xem chuyến không được gán | Không nằm trong query `driverId` | `driver.test.ts` |
| Chat nhà xe khác | Thread theo `carrierId` phiên | `chat.test.ts` |
| Claim giả `carrierId` trong body | 400 | `security.test.ts` |
| Sàn trả DTO | Không có `shipperId`, email tài khoản, `latestLocation` | `marketplace.test.ts`, `gps.test.ts` |
| Đọc audit | Không có route `/api/audit`. Request lạ rơi `notFoundHandler` | `health.test.ts` cho route lạ; không có test riêng “GET audit là 404” |
| Admin đọc đơn, GPS, sàn | 403 | `gps.test.ts`, `marketplace.test.ts` |
| Route UI | `RoleGate` theo role. Khách vào khu làm việc bị đẩy đăng nhập | Không có test trình duyệt |

Cookie và Origin không được rà lại bằng exploit mới. Test login từ origin lạ đã có trong `auth.test.ts`.

## Việc không được gọi là lỗ đã xác nhận

- Hai doanh nghiệp “cùng tenant” đọc được nhau: không có tenant nên không tái hiện được. Các ca chủ hàng A/B và nhà xe A/B đều bị chặn theo quan hệ.
- Nhà xe thua vẫn đọc chat cũ: đây là quy tắc tạm trong `chatAccess.ts`, đã được test, chưa phải sự cố.
- Số điện thoại trên sàn: DTO cố ý trả số liên hệ điểm lấy/giao. Master §4 cho phép gọi. Không tính là lộ mật khẩu hay email tài khoản.
- Audit có thể mất nếu process chết sau ghi đơn: rủi ro bền vững, chưa có ca chứng minh một đơn thật bị mất log.

## Audit

`recordSuccessfulAudit` ghi sau publish, claim, assign, pickup, delivery, tạo xe, sửa xe, sửa tên tài xế. Pickup và delivery chỉ ghi audit khi document cập nhật khác null, nên lần bấm lặp không thêm audit.

Thiếu so với Master §7.2: `tenant_id`, giá trị trước/sau của từng field khi sửa đơn, lý do hủy, chống sửa log, thời hạn lưu, màn tra cứu. Sửa đơn và hủy đơn chưa có nghiệp vụ nên chưa có audit tương ứng.

## Bộ test backend

45 lời gọi `test(`. Không chạy lại trong đợt rà soát này.

| File | Việc phủ | Khẳng định chính | Thiếu |
| --- | --- | --- | --- |
| `auth.test.ts` | Phiên | Đúng mật khẩu, sai mật khẩu, thiếu trường, `/me`, role, logout, xóa user, origin lạ | Khóa tài khoản, hết hạn cookie theo giờ thật |
| `health.test.ts` | Sống | DB ngắt, route lạ JSON | Health khi DB đúng không nằm ở file này |
| `shipment.test.ts` | Đăng đơn | PUBLISHED, cấm role, validate, đơn cũ vẫn đọc, carrier không thấy email | Sửa đơn, nháp |
| `claim.test.ts` | Claim | Chỉ carrier xem sàn, một người thắng, tranh chấp | Popup UI |
| `assignment.test.ts` | Gán | Đúng chủ, nhãn “Chờ lấy hàng”, hai request một cặp | Độc quyền xe, xóa xe |
| `driver.test.ts` | Mốc | Chỉ chuyến được gán, lấy rồi giao, tranh chấp pickup, body giả | UI nút |
| `timeline.test.ts` | Event | Đủ năm loại, không nhân đôi khi lặp, đơn không có event vẫn đọc | Đổi tên sau ASSIGNED nằm ở `integration.test.ts`, xem `08-timeline-history-fix.md` |
| `gps.test.ts` | Vị trí | Policy, upload IN_TRANSIT, từ chối giả, không lộ tọa độ trên sàn, lấy/giao khi chưa có GPS | Quyền trình duyệt, bản đồ |
| `chat.test.ts` | Chat | Hai thread, không Claim, body xấu, gửi đồng thời | Rate limit, retention, UI |
| `fleet.test.ts` | Đội xe | Đúng chủ, gán xe mới, sửa tên, từ chối role giả | Màn hình, xóa xe |
| `security.test.ts` | Quan hệ và audit | Cách ly, audit một lần, chat/GPS không lẫn, claim thua không có audit thắng | Crash giữa ghi đơn và ghi log |
| `marketplace.test.ts` | Sàn | PUBLISHED, lọc, sort, 400, vai trò, chat/bookmark không Claim, tranh chấp | So sánh UI, phân trang trên 100 |

Câu này đúng lúc viết MVP-01. `integration.test.ts` sau đó đã có một ca từ đăng đơn đến giao hàng và audit. Ca đổi tên xe và tài xế nằm cùng file, xem `08-timeline-history-fix.md`.

## Frontend

Không có test tự động cho:

- Popup Claim mở mà chưa POST
- So sánh hai thẻ
- Quyền GPS của trình duyệt
- Form thêm và sửa xe
- `RoleGate` chuyển hướng
- Bố cục 390px
- Poll chat và poll vị trí

`npm run lint`, `tsc -b` và `vite build` đã qua ở lượt Core 13. Build không thay cho nghiệm thu.

## Bundle

`web` build báo chunk `index` khoảng 1.507,79 kB minified, gzip khoảng 413,40 kB, kèm cảnh báo trên 500 kB. Ảnh hưởng: tải lần đầu của demo chậm hơn, nhất là máy yếu. Không đổi quyền, không đổi dữ liệu. Tách route là P3, làm sau khi chức năng được nghiệm thu.
