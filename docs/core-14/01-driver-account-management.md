# Core 14 — Tài khoản tài xế do nhà xe quản lý

Quyết định: D-23 trong Master Const v2.4. Ngày duyệt chính sách: 17/10/2026.

Một tài khoản có một vai trò. MVP đang bật SHIPPER, CARRIER, DRIVER và ADMIN. WAREHOUSE vẫn là Phase 2 và không có trong mã đăng nhập. Không có Role Switcher. Không có Organization/Membership và không chuyển tài xế giữa các nhà xe.

## Mô hình

DRIVER thuộc đúng một CARRIER. `carrierId` lấy từ người dùng CARRIER của phiên đăng nhập. Request tạo tài khoản bị từ chối nếu có thêm trường ngoài tên hiển thị và email, kể cả `carrierId`, `role` hoặc mật khẩu do client chọn.

Nhà xe cha phải là user vai trò CARRIER và không ở trạng thái khóa. Tài xế không tự đổi nhà xe cha. Nhà xe khác không xem và không quản lý tài xế đó. SHIPPER, DRIVER và ADMIN không gọi các API quản lý này.

Tài xế cũ không có `carrierId` được giữ nguyên. Không có migration gán nhà xe. Nhà xe không nhận các tài khoản đó vào danh sách của mình. Phân công vẫn trả 400 vì tài xế không thuộc nhà xe. Việc liên kết về sau cần một quyết định quản trị riêng.

## Trường tài khoản

Trên `User`:

- `accountStatus`: `ACTIVE` hoặc `LOCKED`. Thiếu trường được hiểu là `ACTIVE`.
- `mustChangePassword`: boolean. Thiếu trường hoặc giá trị khác `true` được hiểu là không bắt buộc đổi.
- `sessionVersion`: số, mặc định 0. JWT ghi claim `sv`. Token cũ không có `sv` được tính là 0.
- `heldShipmentIds`: danh sách id chuyến đang giữ để khóa và phân công không chạy đè lên nhau.

Profile nhà xe chỉ sửa tên hiển thị. Client không đặt `role`, `carrierId` hoặc `accountStatus` qua API hồ sơ.

## Mật khẩu tạm

Server tạo 20 ký tự bằng `crypto.randomInt` trên bộ chữ không gồm các ký tự dễ nhầm. Mật khẩu được băm bằng bcrypt cost 12, cùng cách với đăng nhập hiện có. Bản rõ chỉ có trong response tạo hoặc đặt lại thành công. Không ghi vào database, audit, log, URL, đơn hàng, `localStorage` hoặc `sessionStorage`.

Mật khẩu mới do tài xế chọn dài từ 8 đến 72 ký tự. Đây là giới hạn đã dùng với bcrypt, không thêm OTP.

## Đăng nhập lần đầu

Sau khi đăng nhập đúng, nếu `mustChangePassword` là true, cookie phiên được cấp nhưng middleware `requireOperationalSession` trả 403 `password_change_required` cho đơn, chat, đội xe, chuyến nhà xe và chuyến tài xế. `GET /api/auth/me`, logout và `POST /api/auth/change-required-password` vẫn dùng được.

Đổi thành công thì lưu hash mới, tắt cờ, tăng `sessionVersion` và cấp cookie mới. Mật khẩu tạm và cookie cũ hết hiệu lực. Tài xế sau đó vào khu vực tài xế bình thường.

## Khóa, mở khóa, đặt lại mật khẩu

Chỉ CARRIER sở hữu tài xế được gọi.

Tài khoản khóa không đăng nhập được: đúng mật khẩu trả 403 `account_locked` và không cấp cookie. Phiên đã cấp trước đó bị từ chối ở `requireAuth` vì `sessionVersion` tăng lúc khóa, hoặc vì trạng thái khóa. Sai mật khẩu vẫn là 401 chung, không lộ việc email có tồn tại.

Mở khóa không đổi trạng thái đơn và không tăng `sessionVersion`. Phiên bị hủy lúc khóa không sống lại.

Đặt lại mật khẩu tạo mật khẩu tạm mới, bật `mustChangePassword`, tăng `sessionVersion` và chỉ trả mật khẩu một lần. Có thể đặt lại tài xế đang khóa nếu tài xế không có chuyến đang chạy. Sau khi mở khóa, tài xế vẫn phải đổi mật khẩu tạm mới.

## Chuyến đang phụ trách

Không khóa và không đặt lại mật khẩu khi tài xế đang gắn với đơn `MATCHED` hoặc `IN_TRANSIT`. `DELIVERY_CONFIRMED` không bị tính là chuyến đang chạy.

API trả 409 với câu tiếng Việt:

- Khóa: "Không khóa được tài xế đang phụ trách chuyến chưa kết thúc."
- Đặt lại mật khẩu: "Không đặt lại mật khẩu cho tài xế đang phụ trách chuyến chưa kết thúc."

Không tự gỡ phân công, không hủy đơn và không phân công lại. Nếu lệnh khóa không thành công, tài khoản vẫn mở.

Phân công ghi id chuyến vào `heldShipmentIds` bằng một cập nhật có điều kiện trước khi ghi đơn. Điều kiện gồm đúng nhà xe, vai trò DRIVER, tài khoản đang mở, không còn mật khẩu tạm, và chuyến đó chưa nằm trong danh sách giữ. Khóa và đặt lại mật khẩu chỉ chạy khi danh sách giữ trống và không có đơn MATCHED hoặc IN_TRANSIT.

MongoDB đang dùng không có transaction nhiều document. Nếu process chết sau khi đã thêm id chuyến nhưng trước khi ghi đơn hoặc trước khi gỡ id khi ghi đơn thất bại, id đó có thể nằm lại. Khi đó khóa và đặt lại mật khẩu bị chặn cho đến khi được xử lý tay. Phân công một chuyến khác vẫn có thể tiếp tục. Không tự xóa id mới giữ, vì xóa sớm sẽ mở lại khoảng đua giữa khóa và phân công.

Giao hàng thành công, kể cả lần gọi lặp khi đơn đã `DELIVERY_CONFIRMED`, gỡ đúng id chuyến đó khỏi danh sách. Mở khóa không đụng danh sách này.

Một tài xế vẫn có thể được ghi trên nhiều chuyến. Danh sách giữ chứa từng id, không biến tài xế thành chỉ được một chuyến.

## API

Tất cả route dưới `/api/carrier/fleet` yêu cầu cookie CARRIER, phiên đã qua bước đổi mật khẩu bắt buộc, và origin tin cậy với lệnh ghi.

| Method | Path | Kết quả |
| --- | --- | --- |
| `GET` | `/api/carrier/fleet/drivers` | Danh sách tài xế của nhà xe trong phiên |
| `POST` | `/api/carrier/fleet/drivers` | 201 `{ driver, temporaryPassword }` |
| `GET` | `/api/carrier/fleet/drivers/:id` | Một tài xế thuộc nhà xe, hoặc 404 |
| `PATCH` | `/api/carrier/fleet/drivers/:id` | Chỉ đổi tên hiển thị |
| `POST` | `/api/carrier/fleet/drivers/:id/lock` | Khóa |
| `POST` | `/api/carrier/fleet/drivers/:id/unlock` | Mở khóa |
| `POST` | `/api/carrier/fleet/drivers/:id/reset-password` | `{ driver, temporaryPassword }` |
| `POST` | `/api/auth/change-required-password` | Body chỉ có `newPassword` |

DTO danh sách và chi tiết chỉ có `id`, `displayName`, `email`, `accountStatus`, `mustChangePassword`. Không có hash, cookie hay mật khẩu. Mật khẩu tạm chỉ có ở response tạo và đặt lại.

Email được cắt khoảng trắng và đưa về chữ thường. Trùng email trả 409 "Email này đã được dùng." Email sai trả 400. Nhà xe khác nhận 404 khi trỏ vào tài xế không thuộc mình. Vai trò sai nhận 403.

User đăng nhập và `/api/auth/me` thêm `accountStatus` và `mustChangePassword`.

## Giao diện

Nhà xe dùng màn đội xe sẵn có, không có ứng dụng đội xe thứ hai.

- `/carrier/doi-xe/tai-xe` liệt kê tên, email, trạng thái, việc đã đổi mật khẩu hay chưa, và form tạo.
- Mật khẩu tạm hiện một lần, có nút sao chép, và mất khi đóng. Không lưu vào storage.
- Hồ sơ tài xế xác nhận trước khi khóa, mở khóa hoặc đặt lại mật khẩu. Lỗi 409 hiện câu từ server.
- Tài xế bị bắt đổi mật khẩu vào `/driver/doi-mat-khau` trước khu chuyến. Guard này nằm ngoài layout chuyến. Logout vẫn có.
- Dropdown phân công chỉ hiện tài xế đang mở và đã đổi mật khẩu. Server vẫn từ chối nếu giao diện bị bỏ qua.

Chưa bấm các màn này trên trình duyệt. Không có ảnh nghiệm thu.

## Audit

Sau khi tạo, khóa, mở khóa hoặc đặt lại mật khẩu thành công, hệ thống ghi:

- `DRIVER_ACCOUNT_CREATED`
- `DRIVER_ACCOUNT_LOCKED`
- `DRIVER_ACCOUNT_UNLOCKED`
- `DRIVER_PASSWORD_RESET`

Bản ghi có người thực hiện, tài xế đích, thời điểm và tên trường an toàn. Không có mật khẩu, hash, cookie hay token. Lệnh bị từ chối không được ghi như một hành động thành công.

Audit được ghi sau khi cập nhật user đã xong. Insert audit nuốt lỗi trừ khóa trùng. Insert không nằm trong cùng transaction với việc tạo hoặc khóa tài khoản. Process chết giữa hai bước có thể mất audit dù tài khoản đã đổi. Các action mới không thuộc nhóm one-shot, nên mỗi lần đặt lại mật khẩu thành công có thể có một dòng audit riêng.

## Rủi ro còn mở

- Id chuyến kẹt trong `heldShipmentIds` sau khi process chết giữa lúc giữ và lúc ghi đơn.
- Audit có thể thiếu nếu insert thất bại sau khi tài khoản đã đổi.
- Chưa có giới hạn tần suất đăng nhập.
- Logout chỉ xóa cookie. Token đã sao chép còn hiệu lực cho đến khi hết hạn, trừ khi khóa, đặt lại mật khẩu hoặc đổi mật khẩu bắt buộc làm tăng `sessionVersion`.
- Liên kết tài xế mồ côi, chuyển nhà xe, giấy tờ và email mời chưa được duyệt.
- Không có quyền admin mới để khóa hộ hoặc lấy lại mật khẩu khẩn cấp.
- Nghiệm thu trình duyệt chưa làm. Tile Mapbox cũng chưa được nghiệm thu tay.
