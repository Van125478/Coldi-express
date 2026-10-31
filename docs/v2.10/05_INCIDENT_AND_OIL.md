# Sự cố và giá dầu — APPROVED, NOT IMPLEMENTED

> Tiêu đề “chưa có mã” đúng lúc viết file này ngày 18/10/2026. Sau đó đã có bản kỹ thuật sự cố và đường đọc Brent/WTI. Luật nghiệp vụ bên dưới vẫn là luật đã chốt. Trạng thái mã và phần còn khóa nằm ở [mô tả dự án và luồng nghiệp vụ](00_MO_TA_DU_AN_VA_LUONG.md), [handoff sự cố](../incident/MVP_HANDOFF.md) và [handoff dầu](../oil/MVP_HANDOFF.md).

Nguồn duyệt là hồ sơ CURRENT v2.8 đọc ngày 18/10/2026. v2.7 trên Git vẫn ghi các mục này là mở vì PR #5 merge trước khi quyết định v2.8 được đưa vào repository. v2.10 thay câu đó. Không có module sự cố hay giá dầu trong mã đã merge.

## INC-01 — APPROVED

- Shipper báo sự cố trên đơn của mình.
- Carrier báo sự cố trên đơn nhà xe mình đã Claim.
- Driver chỉ báo trên chuyến đang được gán cho mình.
- Carrier phản hồi tuyến đầu. Admin được chỉ định xử lý khi sự cố được chuyển cấp.
- Người xem không được thấy hồ sơ ngoài quyền. Client không được gửi vai người báo.
- Tạo sự cố không đổi trạng thái chuyến và không HOLD hoa hồng.

## INC-02 — APPROVED

Trạng thái chính: `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED`.

Phản đối đưa `RESOLVED` về `IN_PROGRESS` và có audit. `RESOLVED` chưa phải `CLOSED`. Chuyển cấp là chiều riêng, không ghi đè trạng thái chính.

Enum chi tiết của chiều chuyển cấp là đề xuất kỹ thuật, chưa phải quyết định riêng. Quyền đóng và mở lại sau `CLOSED` vẫn OPEN.

## INC-03 — APPROVED

Sáu loại: nhiệt độ, phương tiện, chậm trễ, hàng hóa, lấy/giao hàng, khác. Form chữ cơ bản. Ảnh là tùy chọn.

File không phải ảnh và IoT nằm sau MVP. Giới hạn dung lượng ảnh sự cố vẫn OPEN. Không lấy "3 ảnh, 5 MB" làm luật đã duyệt.

## INC-04 — APPROVED

Có thông báo trong ứng dụng, mức ưu tiên và nhắc nội bộ cấu hình được. Không hứa SLA cứng và không hứa trực 24/7.

Ngưỡng ưu tiên, chu kỳ nhắc và người phân loại đơn chưa có Carrier vẫn OPEN.

## OIL-01 và OIL-02 — APPROVED

Chỉ hiển thị giá dầu thô thế giới mới nhất của Brent và WTI. Ưu tiên nguồn kiểm chứng được, ví dụ EIA. Không gọi dữ liệu theo kỳ là giá realtime. Không đổi sang VND/lít và không dùng giá dầu bán lẻ Việt Nam.

Đơn vị là USD/thùng. Mỗi số có chuẩn dầu, giá, ngày quan sát của nguồn, thời điểm hệ thống lấy, nhà cung cấp và URL nguồn. Không suy thời điểm công bố từ thời điểm lấy dữ liệu.

## OIL-03 — APPROVED

Widget gọn trên trang chủ công khai, trang Shipper và trang Carrier. Driver không bắt buộc có widget trong MVP. Không bắt một trang giá riêng hay biểu đồ lịch sử.

## OIL-04 — APPROVED

Đồng bộ phía server 2–4 lần mỗi ngày. Dữ liệu cũ khi đã lỡ ít nhất hai kỳ công bố được xác minh, có trừ ngày nghỉ đã biết. Nếu chưa có lịch phát hành đã kiểm chứng thì trạng thái là chưa xác định, không tự gọi là mới và không tự gọi là cũ. Giữ giá hợp lệ cuối cùng. Không có giá thì báo không có, không điền số 0.

Giờ chạy trong ngày, lịch EIA cụ thể và giấy phép API vẫn OPEN. Không tự chọn nhà cung cấp thay thế khi chưa duyệt.

Lỗi nguồn giá dầu không được làm hỏng đăng nhập, đăng đơn, Claim, chat, GPS, lấy hàng hay giao hàng.
