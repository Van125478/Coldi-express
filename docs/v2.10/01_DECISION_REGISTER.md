# Sổ quyết định v2.10

> Ảnh chụp ngày 18/10/2026. Cột “Mã trên main” của COM, INC và OIL đúng với ngày đó. Bản giải thích đang dùng, gồm mã làm sau ngày này và giá Business/Enterprise đã công bố, là [mô tả dự án và luồng nghiệp vụ](00_MO_TA_DU_AN_VA_LUONG.md).

`APPROVED` là Product Owner đã chốt hướng nghiệp vụ. `OPEN` là chưa được tự đặt. `IMPLEMENTED` chỉ dùng khi mã đã nằm trên `main` và có bằng chứng kiểm tra. Duyệt tài liệu không có nghĩa đã có mã.

| ID | Quyết định | Duyệt | Mã trên main |
| --- | --- | --- | --- |
| PKG-01 | Giá và tỷ lệ cố định là baseline thương mại. Chưa bán online. | APPROVED | IMPLEMENTED catalog. Không có thanh toán. |
| PKG-02 | Gói thuộc tài khoản User. Driver không mua gói. | APPROVED | IMPLEMENTED |
| PKG-03 | Trần xe ACTIVE: Free 2, Pro tháng/năm 10, Business 30, Enterprise theo hợp đồng. | APPROVED | IMPLEMENTED |
| PKG-06B | Tự kích hoạt gói trả phí chỉ trong Demo/QA được cấp phép. Production từ chối. | APPROVED | IMPLEMENTED |
| PKG-07 | Hết hạn về Free. OVER_LIMIT chặn Claim mới. Giữ chuyến cũ. Hạ gói cuối kỳ. Archive/Restore. | APPROVED | IMPLEMENTED |
| VEH-01 | Một xe chỉ gắn một chuyến chưa hoàn thành. | APPROVED | IMPLEMENTED trong PR #6 |
| COM-01..07A | Hoa hồng hai phía trên `listedPriceVnd`. Làm tròn half-up từng bên. ESTIMATED rồi ACCRUED. Không tự PAID. Chỉ mô phỏng Demo/QA khi được làm. | APPROVED | NOT IMPLEMENTED |
| INC-01..04 | Báo cáo sự cố theo vai, trạng thái và form đã duyệt ở v2.8. | APPROVED | NOT IMPLEMENTED |
| OIL-01..04 | Giá dầu thô Brent và WTI, widget và độ mới đã duyệt ở v2.8. | APPROVED | NOT IMPLEMENTED |
| CHAT-01 | Chủ hàng mở chat với nhà xe ngay sau Claim. | APPROVED | NOT IMPLEMENTED |
| FORM-01 | Lỗi validation ngay dưới từng trường. | APPROVED | NOT IMPLEMENTED |
| IMG-01 | Đơn mới bắt buộc 1–5 ảnh hàng hóa. Định dạng và dung lượng chưa duyệt. | APPROVED phần số lượng | NOT IMPLEMENTED |
| DRIVER-04 | Carrier tạo username/password. Không bắt email. Không bắt đổi mật khẩu lần đầu. | APPROVED | NOT IMPLEMENTED |
| TEXT-01 | Timeline không lặp "Xe Xe" hay "Tài xế Tài xế". | APPROVED | NOT IMPLEMENTED |
| UX-04 | Dashboard Carrier thêm tổng chuyến đang vận chuyển và đã giao. | Chưa duyệt triển khai | NOT IMPLEMENTED |
| PKG-04, PKG-05 | Quota đơn Shipper và quyền lợi Premium. | OPEN | NOT IMPLEMENTED |
| OPEN-COM | Điều kiện hủy, ngưỡng HOLD/ADJUST, thu tiền thật. | OPEN | NOT IMPLEMENTED |
| OPEN-INC | Quyền đóng/mở lại, hạn báo sau giao, dung lượng file, ngưỡng ưu tiên, người phân loại. | OPEN | NOT IMPLEMENTED |
| OPEN-OIL | Lịch phát hành EIA, giờ sync trong ngày, giấy phép API. | OPEN | NOT IMPLEMENTED |

Chi tiết giá nằm ở [Package](02_PACKAGE_IMPLEMENTED.md). Chi tiết backlog nằm ở [UAT](03_UAT_BACKLOG.md). Sự cố và dầu nằm ở [05](05_INCIDENT_AND_OIL.md). Hoa hồng nằm ở [06](06_COMMISSION_NEXT.md).

Sự cố không tự đổi trạng thái chuyến, không tự HOLD hoa hồng, không tự dừng GPS và không tự hủy chuyến. Giá dầu không đổi giá cước, giá gói, hoa hồng hay số liệu nhiên liệu của xe.
