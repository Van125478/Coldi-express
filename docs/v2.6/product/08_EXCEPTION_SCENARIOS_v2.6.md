# COLDI v2.6 — Ma trận tình huống ngoại lệ liên module

Tất cả expected result ở đây là **acceptance proposal**, không phải ca đã chạy PASS. Dùng để review sản phẩm, sau đó chuyển thành test case backend/frontend trên môi trường QA.

| ID | Ngữ cảnh | Tình huống | Kết quả đề xuất an toàn |
| --- | --- | --- | --- |
| EX-01 | Pricing | Shipper Free 5%, Carrier Pro 4% | Hai fee riêng cùng B; tổng tiền từng phía minh bạch |
| EX-02 | Pricing | Cả hai đều Free 5% | Platform đề xuất thu hai fee 5% độc lập; không thu B hai lần |
| EX-03 | Pricing | Carrier Enterprise rate `1,5–2,5%` chưa chốt | Không tự dùng trung bình; báo cần báo giá trước Claim |
| EX-04 | Pricing | Mất mạng ngay sau Claim thành công | Retry GET/Claim idempotent; một snapshot Carrier duy nhất |
| EX-05 | Pricing | Hai Carrier cùng Claim một PUBLISHED | Một thắng, một 409; chỉ winner có Carrier fee snapshot |
| EX-06 | Pricing | Shipper đổi Free→Pro khi đơn đã PUBLISHED | Snapshot Shipper chuyến cũ không đổi; chuyến mới dùng rate mới nếu policy duyệt |
| EX-07 | Pricing | Carrier Pro hết hạn khi IN_TRANSIT | Chuyến đã Claim giữ rate; Driver vẫn hoàn thành GPS/giao |
| EX-08 | Pricing | Chưa có payment gateway | UI chỉ estimated/accrued, không chuyển PAID hoặc trừ tài khoản |
| EX-09 | Pricing | Cancel trước Claim | Không tạo Carrier fee, không ghi commission hoàn tất |
| EX-10 | Pricing | Delivery lặp hoặc rollback API | Không thu/ghi phí trùng; audit và outbox/transaction |
| EX-11 | Package | Carrier Free có 2 xe, đồng thời gửi 2 POST thêm xe | Không vượt cap; lỗi định danh `plan_limit_exceeded` với nội dung rõ |
| EX-12 | Package | Carrier đang có 8 xe, hạ Free 2 xe | Không xóa xe; giữ chuyến đang chạy; chỉ khóa hành động mới theo policy |
| EX-13 | Package | Shipper chưa có gói vì dữ liệu cũ | Không tự cấp Pro/Enterprise; xử lý migration Free có audit khi duyệt |
| EX-14 | Package | Request paid PENDING, user bấm đi bấm lại | Tạo một yêu cầu idempotent; chưa được gán quyền Pro |
| EX-15 | Package | Admin approve 2 lần do network retry | Chỉ một assignment active đúng kỳ; có audit |
| EX-16 | Package | Quota reset ở cuối tháng ngày 31/02 leap | Timezone/calendar policy rõ, không cộng dùng trùng |
| EX-17 | Package | Khóa tài khoản Driver khi đang có chuyến | Tôn trọng rule bảo vệ chuyến Core14, không dùng plan để bypass |
| EX-18 | Oil | EIA chưa ra giá mới cuối tuần | Hiển thị last source observation, không coi là giá realtime |
| EX-19 | Oil | Provider timeout/429 | Fallback cache và cảnh báo cũ, không phá login/Claim |
| EX-20 | Oil | Provider trả đơn vị USD/gallon thay vì USD/barrel | Reject bản ghi không đúng schema/benchmark, không đổi đơn vị âm thầm |
| EX-21 | Oil | Cache trống / invalid price | UI unavailable, không hiện 0 USD hoặc sample |
| EX-22 | Oil | User yêu cầu cập nhật trực tiếp | Nói rõ nguồn có độ trễ, không hứa giá tick-by-tick |
| EX-23 | Incident | Driver chưa được assign gửi incident cho shipment | Backend từ chối, không lộ đơn |
| EX-24 | Incident | Driver gửi form hai lần | Một incident từ idempotent request hoặc cảnh báo trùng, không duplicate do retry |
| EX-25 | Incident | Sự cố OPEN trong IN_TRANSIT | Shipment vẫn IN_TRANSIT cho tới transition logistics hợp lệ |
| EX-26 | Incident | Đơn đã giao nhưng sự cố chưa đóng | Incident còn mở theo policy, không tự CLOSED chỉ vì Delivery |
| EX-27 | Incident | Carrier khác gọi GET incident | 404/403 theo RBAC convention, không leak |
| EX-28 | Incident | Shipper không được xem note nội bộ | Redact theo visibility, không trả cả object cho FE rồi ẩn |
| EX-29 | Incident | Admin xem toàn cục và GPS dù không phụ trách | Từ chối trừ khi có permission explicit, không mặc định bypass |
| EX-30 | Integration | Mapbox token thiếu nhưng GPS hợp lệ | Hiển thị thời điểm/toạ độ hợp lệ, báo map chưa cấu hình; không vẽ giả |
| EX-31 | Integration | Chat tạo trước Claim rồi Carrier khác Claim thắng | Chính sách đọc/gửi thread của Carrier thua còn OPEN; không xóa lịch sử tùy tiện |

## Phân loại bug

P0: đọc chéo dữ liệu nhạy cảm/ghi bậy DB, double-collection, bypass hạn mức gây phá trạng thái. P1: tính fee sai/rate snapshot thay đổi, đơn không thể hoàn tất, map/incident/tier required workflow hỏng. P2: UX/error reporting, số liệu không cập nhật nhưng fallback rõ. P3: polish ngoài MVP.
