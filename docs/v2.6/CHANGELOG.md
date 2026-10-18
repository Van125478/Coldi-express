# COLDI Documentation Changelog — v2.6

> **Phụ lục 18/10/2026, sau khi PR #4 đã merge:** chính sách giá, gói và hoa hồng chuyển sang [v2.7](../v2.7/CHANGELOG.md). Changelog gốc bên dưới mô tả lúc xuất bản v2.6. Câu "giá và tỷ lệ là phương án đề xuất" và "chưa được merge" là lịch sử của đợt đó. PR #4 đã merge tại `30c9d5fea609e041cb56f9634769cf61f13388b4`. Bản chú thích này không phải nội dung gốc của commit đó.

**Ngày xuất bản:** 18/10/2026. **Bản tham chiếu trước:** bộ tài liệu v2.4 Revision 2 (18/10/2026). **Bộ này:** v2.6. **Chính sách hiện hành:** v2.7. Không tự giả lập một bản v2.5 đã xuất bản.

## Thay đổi bắt buộc

1. **Phương án A hoa hồng hai phía:** SHIPPER và CARRIER dự kiến cùng trả phí theo tỷ lệ gói độc lập trên cước chuyến. Có công thức, ví dụ và các trạng thái chỉ **ghi nhận/ước tính** vì chưa có thanh toán online.
2. **Giá dầu thế giới:** thay hoàn toàn ý hiểu cũ `Fuel Statistics` = đổ dầu/tiêu hao/chi phí nhiên liệu. Scope mới là **cập nhật giá dầu thô quốc tế** với nguồn dữ liệu và ngày quan sát; không có form nhập dầu của tài xế.
3. **Danh mục gói:** ghi đủ **4 gói SHIPPER** và **5 gói CARRIER** theo ảnh, giá và tỷ lệ là phương án đề xuất, không tự kích hoạt thu phí.
4. **Incident Reporting:** bổ sung flow và phân quyền đề xuất, sự cố là entity riêng; không tự đổi shipment sang `INCIDENT`.
5. **Subscription lifecycle:** bổ sung catalog, xem gói, yêu cầu nâng gói, admin cấp thủ công, hết hạn, quota, double-request, audit, dữ liệu/chuyến đang chạy.
6. **Open decisions:** chốt cái gì đã xác nhận, cái gì còn PENDING (thu phí, gói enterprise, giá chính thức, quota, chính sách hủy, dầu API, SLA sự cố).
7. **QA/Architecture/Hand-off:** chia status CODE/TEST/UAT, E2E safe QA, API/RBAC và hướng dẫn import docs mà không merge code.

## Không thay đổi

- Logistics lifecycle hiện tại `PUBLISHED → MATCHED → IN_TRANSIT → DELIVERY_CONFIRMED`.
- GPS Carrier/Shipper được đọc theo quyền chuyến, Driver chỉ gửi khi `IN_TRANSIT`.
- Online payment, VAT/tax, đối soát thanh toán thực tế không được giả định đã có.
- Bản DOCX v2.4 là nguồn lịch sử; không bị xóa.
- **Chưa thực hiện thay đổi vào GitHub, không tự chạy FE-05B hay implement ba module mới trong đợt biên soạn docs này.** Câu này mô tả lúc ZIP còn nằm ngoài repo.

## Tích hợp vào Git

Bản Markdown v2.6 được đặt vào `docs/v2.6/` trên nhánh tài liệu riêng, xuất phát từ `main` `7d07e941ace1d3490996c53a6bed36478a6d4836`. Không đổi giá, tỷ lệ, hạn mức hay nhãn APPROVED, PROPOSED, OPEN. `_ARCHIVE_PREVIOUS` trong ZIP không được copy. Bản nháp tiêu hao nhiên liệu xe không được nhập làm yêu cầu hiện hành. PR docs-only chờ Product Owner review và chưa được merge. Không có thay đổi backend, frontend hay database trong lần tích hợp này.
