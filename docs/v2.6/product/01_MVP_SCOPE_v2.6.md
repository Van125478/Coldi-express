# COLDI v2.6 — Phạm vi MVP hiện hành

> Chính sách giá, gói và hoa hồng hiện hành nằm ở [v2.7](../../v2.7/README.md). File này giữ phạm vi mô tả lúc PR #4.

**Phê duyệt định hướng:** Logistics + Package Management + Package Information + World Oil Price Update + Incident Reporting + E2E, theo lời Product Owner. Phí hoa hồng hai phía, bảng giá cố định và trần xe đã được duyệt trong v2.7. Câu gốc lúc PR #4 nói bảng giá và quy tắc vận hành vẫn là proposal. **Code state không thay đổi do docs này.** Module gói, hoa hồng, giá dầu và sự cố vẫn chưa được triển khai.

## 1. Ranh giới sản phẩm

| ID | Epic bắt buộc | Ghi chú | Thực trạng baseline main 7d07e941 |
| --- | --- | --- | --- |
| LOG | Logistics core | Shipper đăng đơn; Carrier tìm, chat, claim, assign; Driver pickup, GPS, delivery; timeline | CODE EXISTS, browser E2E chưa nghiệm thu |
| FLEET | Xe/tài xế | Carrier quản lý phương tiện, cấp/khóa/reset tài xế | CODE EXISTS, browser UAT pending |
| TRACK | GPS/Mapbox | Shipper + Carrier được đọc GPS đúng chuyến; Driver gửi điểm; map cần token | API tests có; tile/marker thật chưa xác minh |
| PKG | Gói dịch vụ | Shipper 4 tier, Carrier 5 tier, quyền lợi/hạn mức, admin cấp gói, customer xem gói | NOT IMPLEMENTED |
| COM | Hoa hồng hai phía | Cước cơ sở + phí Shipper + phí Carrier, snapshot, đối soát trạng thái không thanh toán | NOT IMPLEMENTED; policy đề xuất |
| OIL | Giá dầu thế giới | Hiện giá Brent và WTI USD/thùng, nguồn/ngày cập nhật/fallback | NOT IMPLEMENTED |
| INC | Báo cáo sự cố | Tạo, nhận, xử lý, đóng với audit và quyền hạn phù hợp | NOT IMPLEMENTED |
| QA | Acceptance | E2E logistics, billing-calculation, quota, oil, incident, RBAC; update docs & signoff | PENDING |

`ADMIN` hiện là một role có thể login, nhưng workspace API nghiệp vụ chưa hoạt động. Admin gói/sự cố đề xuất phải có policy riêng. WAREHOUSE chưa có.

## 2. Logistics state machine GIỮ NGUYÊN

`PUBLISHED → MATCHED → IN_TRANSIT → DELIVERY_CONFIRMED`.

Timeline events là `PUBLISHED`, `CLAIMED`, `ASSIGNED`, `PICKUP_CONFIRMED`, `DELIVERY_CONFIRMED`. Pickup confirmed là event; không đưa một shipment state mới giữa MATCHED và IN_TRANSIT. Chưa có `COMPLETED` settlement/payment workflow. Báo cáo sự cố mới phải tồn tại riêng để không tự viết lại state machine.

## 3. Các thành phần gói cần phân biệt

- `cargo packageCount`: **số kiện hàng** trên đơn đã có code.
- `subscription plan`: **gói dịch vụ** (Free/Pro/Business/Enterprise), CHƯA có trong code.
- `listedPriceVnd`: **cước vận tải được niêm yết**, KHÔNG phải tổng tiền Shipper phải trả hay doanh thu thuần Carrier sau hoa hồng.
- `commission`: **phí dịch vụ COLDI** theo tỷ lệ mỗi vai, khác `subscription fee` theo tháng/năm.

## 4. Các yêu cầu tối thiểu trước khi cho code mới

1. Phê duyệt version gói và biểu phí, con số quota/cap và chính sách giảm/tăng gói.
2. Quyết định chủ thể gói theo account hiện hành hay Company/Organization (vì hiện không có tenant/membership).
3. Chốt thời điểm cố định tỷ lệ, công thức làm tròn, trách nhiệm phí, sự kiện kiếm phí và cơ chế ngoại lệ.
4. Chốt nguồn dầu, tần suất cập nhật và hành vi stale; không lấy số dầu từ browser demo.
5. Chốt Incident actors/RBAC/form/minimum states/nhận báo cáo; không tự set trạng thái `INCIDENT` lên Shipment.
6. Test trên DB QA riêng; không chạy seed hay mutation trên dev hiện có.

## 5. Phân chia MVP / Phase 2

| MVP bắt buộc | Sau MVP / chờ quyết định riêng |
| --- | --- |
| Xem thông tin gói, cấp gói thủ công nội bộ, entitlement, hạn mức được duyệt, hoa hồng ước tính/ghi nhận | Cổng thanh toán và trừ tiền tự động, thu/hoàn tiền thực tế, hóa đơn thuế/VAT, ví/escrow |
| Giá dầu thô Brent/WTI kèm ngày nguồn; giá mới nhất đã công bố | Cảm biến xe, thống kê số lít/chi phí theo xe, giá bán lẻ trong nước, dự báo/trading signals |
| Báo cáo sự cố và cập nhật xử lý cơ bản | Bồi thường, bảo hiểm, phân xử tranh chấp tài chính, điều phối tự động |
| Các flow vận tải code hiện tại + E2E | WAREHOUSE, đa chi nhánh Enterprise, public signup, geocoding/ETA tuyến đường (trừ khi được duyệt sớm) |

## 6. Điều kiện tuyên bố FULL MVP COMPLETE

Phải có đặc tả Approved, code/test đúng quyền, UAT real browser logistics & các module mới, không còn P0/P1, UI đã được chủ dự án duyệt, docs Git `main` đúng với code. Bộ tài liệu v2.6 hiện **KHÔNG** tuyên bố đã đạt.
