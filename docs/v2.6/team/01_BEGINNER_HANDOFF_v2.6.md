# COLDI v2.6 — Hướng dẫn cho người mới tham gia nhóm

Đây là hướng dẫn hiểu hệ thống và chạy bản code hiện tại; **không phải hướng dẫn thao tác các module v2.6 chưa lập trình**. Toàn bộ đường dẫn `docs/team-testing/*` trong repository hiện có vẫn là hướng dẫn cài đặt chi tiết Windows PowerShell.

## 1. Bắt đầu với source đã merge

1. Clone repository `https://github.com/Van125478/Coldi-express.git` và checkout `main`.
2. Kiểm tra `git rev-parse HEAD` ghi mã commit vào bug report; bản docs này đối chiếu `7d07e941` tại thời điểm soạn.
3. Đọc `README.md` và `docs/team-testing/TEAM_TESTING_GUIDE.md` **trong repo**, không chép mật khẩu từ người khác.
4. Cần Node >=20.19 theo environment hiện tại, npm, MongoDB local hoặc Docker, Chrome/Edge; `npm ci` riêng `server` và `web`.
5. Tạo `.env` local từ mẫu trong `server`, không commit; Mapbox public `pk.` optional chỉ khi test map thật.
6. Chạy Mongo, backend `npm run dev` trong `server`, frontend `npm run dev` trong `web`; kiểm tra API `http://127.0.0.1:4000/api/health`, web `http://127.0.0.1:5173`. Không trộn localhost nếu CORS/cookie cấu hình 127.0.0.1.
7. Seed demo CHỈ trên database mới/disposable đã được cho phép; seed có thể ghi lại hash tài khoản demo, không chạy trên dev chung.

## 2. Luồng vận tải thật hiện có

SHI​PPER (Chủ hàng) tạo PUBLISHED → CARRIER (Nhà xe) tìm/chat/Claim/assign → DRIVER (Tài xế) Pickup IN_TRANSIT/gửi GPS/Delivery → hai phía xem timeline. CARRIER chỉ xem GPS của chuyến đã claim, SHIPPER chỉ xem đơn mình tạo. Mapbox thật chưa được UAT; `DELIVERY_CONFIRMED` không tạo thanh toán.

## 3. Các tab chức năng **CHƯA có trong code**

- Gói thuê bao/đăng ký Pro, quyền gói/quota, Admin cấp gói, phí hoa hồng hai bên.
- Giá dầu **thế giới** Brent/WTI (không phải đổ dầu/lượng dầu xe).
- Báo cáo & xử lý sự cố có lưu DB.

Đừng viết trong tài liệu demo 'click menu Giá dầu' hoặc 'đã mua Pro' khi menu/API chưa tồn tại; hãy gắn nhãn **PLANNED v2.6**.

## 4. Người dùng cuối sẽ thấy gì sau implementation? (DRAFT)

- Shipper và Carrier xem bảng giá đúng đối tượng, xem plan đang hoạt động, gửi yêu cầu nâng gói, biết quota và fee estimate của chính mình.
- Admin được phân quyền quyết định plan requests; không tự xem GPS toàn doanh nghiệp.
- Trang cập nhật giá dầu thế giới: Brent/WTI + USD/thùng + nguồn EIA + ngày quan sát; không là giá diesel trong nước.
- Driver được gán/Carrier chủ claim báo và xử lý sự cố theo quyền, Shipper xem ảnh hưởng chuyến của mình; không tự đổi `IN_TRANSIT` sang `INCIDENT`.

## 5. Trạng thái hiện tại để báo cho đồng đội

**Đã có code**: logistics core, fleet, chat, GPS, auth. **Có automated tests theo báo cáo**: 71 backend. **Chưa kiểm chứng**: toàn bộ FE-05B và Mapbox tiles. **Chưa code**: gói, hoa hồng, giá dầu thế giới, incidents. **Thanh toán online**: sau MVP. Không tuyên bố full MVP complete.
