# COLDI v2.6 — Danh sách quyết định cần Product Owner phê duyệt

> **Bảng trạng thái bên dưới là lời lúc merge PR #4.** Các mục đã được v2.7 duyệt được ghi lại ở cột "Hiện trạng sau v2.7". Cột "Hiện trạng lúc PR #4" giữ nguyên để không viết lại lịch sử. Sổ hiện hành: [v2.7](../../v2.7/01_DECISIONS_AND_SCOPE.md).

**Trạng thái gốc:** các mục dưới đây chưa tự động được duyệt chỉ vì xuất hiện trong tài liệu v2.6. Quyết định đã chuyển sang APPROVED được ghi ở v2.7, ngày 18/10/2026.

| ID | Ưu tiên | Vấn đề | Đề xuất lúc v2.6 | Hiện trạng lúc PR #4 | Hiện trạng sau v2.7 |
| --- | --- | --- | --- | --- | --- |
| COM-01 | P0 | Thu phí cả 2 phía? | **Đã chốt hướng A**: có hai khoản phí riêng Shipper và Carrier | APPROVED DIRECTION | APPROVED |
| COM-02 | P0 | Dùng giá cơ sở nào? | `listedPriceVnd`, không cộng fee vào B để tính phí phía còn lại | PROPOSED | APPROVED |
| COM-03 | P0 | Rate snapshot lúc nào? | Shipper tại PUBLISHED; Carrier tại CLAIM thành công | PROPOSED | APPROVED |
| COM-04 | P0 | Rounding & VAT | Integer bps, round half-up VND; VAT xử lý riêng sau MVP | OPEN | APPROVED; VAT vẫn sau MVP |
| COM-05 | P0 | Khi nào phí hình thành? | Đến DELIVERY_CONFIRMED là ACCRUED, không PAID | PROPOSED | APPROVED |
| COM-06 | P0 | Hủy/chuyển/hoàn/miễn fee | VOID/HOLD/ADJUSTMENT có audit và permission; không auto trừ tiền | OPEN | APPROVED phần VOID/HOLD/adjustment; điều kiện hủy và ngưỡng vẫn OPEN |
| COM-07 | P0 | Tiền được thu thực tế ra sao khi chưa có online payment? | MVP quote/accrual, xác nhận ngoài hệ thống nếu duyệt | OPEN | APPROVED COM-07A: chỉ mô phỏng Demo/QA, không thu tiền thật |
| PKG-01 | P0 | Giá/tên/tỷ lệ trong ảnh đã là bảng chính thức? | Hiển thị là 'đề xuất' cho tới khi ký bảng giá | OPEN | APPROVED làm baseline thương mại dự kiến; chưa bán online |
| PKG-02 | P0 | Gói gắn User hay Organization? | MVP ưu tiên mô hình User hiện có, Organization Phase 2 nếu được duyệt | OPEN | APPROVED: User account |
| PKG-03 | P0 | Cap xe Carrier | Đề xuất max 2/10/10/30/custom, không có minimum tier | OPEN | APPROVED hard cap ACTIVE 2/10/10/30/contract |
| PKG-04 | P0 | Shipper có quota số đơn không? | Chưa có trong ảnh, KHÔNG đặt ngầm | OPEN | OPEN |
| PKG-05 | P0 | Các tính năng Premium thực hiện thế nào? | Chỉ unlock code đã build; không khóa essential workflows | OPEN | OPEN |
| PKG-06 | P0 | Ai cấp gói paid / bằng chứng gì? | Admin permission + request/approval, không tự xem là đã trả tiền | OPEN | APPROVED PKG-06B: tự kích hoạt chỉ Demo/QA được phép |
| PKG-07 | P0 | Hết hạn/nâng/hạ/grace/chu kỳ? | Không làm gãy chuyến đang chạy, giữ fee snapshot | OPEN | APPROVED hết hạn về Free, OVER_LIMIT, hạ gói cuối kỳ; nâng giữa kỳ vẫn OPEN |
| PKG-08 | P0 | Business/Enterprise rate range | Giá/rate theo từng hợp đồng được duyệt, không tự lấy midpoint | OPEN | Ràng buộc không lấy midpoint đã có trong v2.7; điều khoản từng hợp đồng vẫn OPEN |
| PKG-09 | P1 | Nhiều chi nhánh/đội ngũ/role-switcher | Chưa có Organization schema, không cam kết có trong MVP nhỏ | OPEN | OPEN |
| OIL-01 | P0 | Ý nghĩa 'thống kê dầu' | **Chỉ cập nhật giá dầu thô thế giới**, không ghi fuel consumption | APPROVED | APPROVED |
| OIL-02 | P1 | Feed Brent/WTI | Đề xuất EIA Brent và WTI USD/thùng, daily | OPEN | OPEN |
| OIL-03 | P1 | Trang nào hiện giá? | Đề xuất Guest & Carrier Home, hoặc một mục Tin thị trường | OPEN | OPEN |
| OIL-04 | P1 | Stale/sync schedule/error fallback | Cache source period; hiển thị ngày mới nhất có, không tự gắn live | OPEN | OPEN |
| INC-01 | P0 | Ai được báo/xem/xử lý/đóng sự cố? | Driver báo, Carrier xử lý, Shipper xem, Admin theo assignment | OPEN | OPEN |
| INC-02 | P0 | Incident state và tác động Shipment | Entity riêng, KHÔNG tự đổi shipment.status | OPEN | OPEN |
| INC-03 | P1 | Category, priority, field, attachments | Form tối thiểu + audit, file đính kèm deferred nếu không duyệt | OPEN | OPEN |
| INC-04 | P1 | Escalation, notification, SLA | Chưa cam kết trực 24/7 hoặc phản hồi giờ cụ thể | OPEN | OPEN |
| QA-01 | P0 | QA DB và danh tính dùng thử | DB disposable riêng, không chạm dev `coldi` | OPEN | OPEN |
| QA-02 | P0 | Mapbox local & GPS E2E | public token `pk.` + synthetic browser geolocation được ghi rõ | OPEN | OPEN |
| DOC-01 | P1 | Công bố bộ docs v2.6 | Tạo PR docs-only, giải quyết xung đột tài liệu cũ, Product Owner review | PENDING | PR #4 đã merge. Chính sách kế tiếp là v2.7 |

## Rule duyệt

Không tự code các mục còn OPEN ở cột "Hiện trạng sau v2.7". Các mục đã APPROVED trong v2.7 được phép dùng làm đặc tả, nhưng chưa có nghĩa là đã có code. Không giả định 'như ảnh nghĩa là đã chạy'. Câu gốc của mục này nói mọi P0 còn OPEN và phiên bản kế tiếp sẽ là v2.7. Phiên bản đó nay là bản hiện hành.
