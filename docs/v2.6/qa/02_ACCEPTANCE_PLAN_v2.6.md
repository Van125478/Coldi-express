# COLDI v2.6 — Acceptance & test plan (đề xuất, chưa chạy)

**Safety:** Chạy mutate test CHỈ trên DB QA độc lập và được Product Owner cho phép, không phải `coldi` development. Đã có report 71/71 API test, chưa có FE-05B browser E2E. Trong tài liệu này **không có ca nào được gắn PASS** nếu chưa có chứng cứ.

## A. Logistics FE-05B

| ID | Vai trò | Thao tác | Expected |
| --- | --- | --- | --- |
| LOG-E2E-01 | Shipper | Tạo và publish shipment QA | PUBLISHED; nhận id/timeline |
| LOG-E2E-02 | Carrier | Tìm đơn ở sàn, chat trước Claim | Persisted messages; giá và status không đổi |
| LOG-E2E-03 | Carrier A & B | Claim đồng thời | A hoặc B thắng duy nhất; bên còn lại 409 |
| LOG-E2E-04 | Winning Carrier | Assign xe/driver cùng owner | Assignment snapshot; MATCHED |
| LOG-E2E-05 | Assigned Driver | Pickup, chia sẻ GPS | IN_TRANSIT; điểm mới nếu browser cho phép |
| LOG-E2E-06 | Shipper/Carrier | Cùng xem GPS shipment đã Claim | Cùng latest record đúng quyền, Mapbox nếu token hợp lệ |
| LOG-E2E-07 | Driver | Delivery | DELIVERY_CONFIRMED; vị trí cuối chỉ lịch sử; không thanh toán |
| LOG-E2E-08 | Wrong roles | Read GPS/chat/incident của công ty khác | Denied, không leak |

## B. Package, gói và quota

| ID | Test case | Expected |
| --- | --- | --- |
| PKG-01 | Shipper Free mặc định; Carrier Free mặc định | Đúng plan theo actor; không tạo paid purchase |
| PKG-02 | Xem catalogue công khai | 4 Shipper, 5 Carrier tiers **chỉ khi bảng giá được phê duyệt và publish**; dải Enterprise báo giá |
| PKG-03 | Xin Pro khi chưa có payment online | PENDING, không cấp quyền trước Admin approval |
| PKG-04 | Admin approve twice | Một assignment active; audit actor/reason |
| PKG-05 | Carrier Free max 2 (nếu cap duyệt), thêm xe thứ 3 | Server từ chối, giữ input và dữ liệu cũ |
| PKG-06 | Concurrent request khi còn 1 vehicle slot | Chỉ một thêm xe thành công, không vượt cap |
| PKG-07 | Đổi Pro→Free khi có nhiều xe | Không xóa xe, không dừng chuyến IN_TRANSIT |
| PKG-08 | Expiration/leap-day/month-end/timezone | Đúng quy tắc được duyệt, không reset quota sớm/trễ |
| PKG-09 | Cross-owner GET plan/quota | Deny |
| PKG-10 | Feature chưa có code trong tier Enterprise | Không có nút giả/kích hoạt ảo |

## C. Commission & double-sided fee

| ID | Case | Expected |
| --- | --- | --- |
| COM-01 | B=10m, Free Shipper 5%, Monthly Carrier 4% | F_s=500k, F_c=400k; Shipper estimate 10,5m, Carrier net 9,6m; **not PAID** |
| COM-02 | Free + Free 5% mỗi phía | 2 snapshots, mỗi snapshot tính trên B không compound |
| COM-03 | Enterprise dải rate chưa chốt | NEEDS_QUOTE, không dùng midpoint |
| COM-04 | Upgrade giữa PUBLISHED/MATCHED | Existing snapshot không đổi; new shipment áp new rate theo policy |
| COM-05 | Claim concurrent+retry | Một winning carrier snapshot; không duplicate charge |
| COM-06 | Delivery retry | Fee accrual once, không thực hiện payment |
| COM-07 | VOID/HOLD/adjust fee | Chỉ authorized, reason/audit, original snapshot immutable |
| COM-08 | Client sửa % commission trong request | Server bỏ qua/từ chối; rate từ plan server |

## D. World oil prices

| ID | Case | Expected |
| --- | --- | --- |
| OIL-01 | Fetch latest real EIA Brent/WTI | Giá USD/thùng, observedDate/source chính xác |
| OIL-02 | Provider trả 429/timeout | Cache gần nhất + 'dữ liệu có thể đã cũ', hoặc unavailable |
| OIL-03 | Missing latest ngày nghỉ | Hiện observation gần nhất, không gắn live |
| OIL-04 | Invalid unit/date/price | Reject giá sai, không tạo 0 USD giả |
| OIL-05 | No upstream API key | Không lộ key ở frontend, UI vẫn hoạt động với fallback |
| OIL-06 | UAT scope | KHÔNG yêu cầu nhập fuel liters hoặc odometer |

## E. Incident Reporting

| ID | Case | Expected |
| --- | --- | --- |
| INC-01 | Assigned Driver báo incident | OPEN trên đúng shipment, actor/date |
| INC-02 | Driver không được gán/Carrier khác | Denied đúng server-side RBAC |
| INC-03 | Submit retry | Không tạo duplicate incident do network retry |
| INC-04 | Carrier resolve, Shipper xem | Server filter nội dung theo role, có event/audit |
| INC-05 | Inc OPEN khi chuyến IN_TRANSIT | Shipment vẫn IN_TRANSIT, không tự đổi trạng thái |
| INC-06 | Delivery xong nhưng incident OPEN | Incident lifecycle không tự CLOSED |
| INC-07 | Reopen/invalid transition | Có quyền và state rule rõ, lỗi hữu ích |

## F. Phân loại bằng chứng và quy trình signoff

- **Unit/API PASS:** test thực chạy với log SHA, DB isolate.
- **Browser PASS:** thao tác UI thật trên backend/DB QA, screenshots/video đúng shipment ID, không chỉ browser intercept/mock.
- **Mapbox PASS:** actual Mapbox tile+marker với token `pk.` và điểm QA hợp lệ, không nhầm route map.
- **Product ACCEPTED:** người duyệt ký và danh sách màn/flow cụ thể.
- **Version PASS:** changelog v2.6 và code commit được link; nếu đổi rule/giao diện sau duyệt thì tăng docs v2.7.

Không gộp kết quả test từ commit khác như bằng chứng tự chạy mới. Test failed thì ghi P0–P3, không giả lập pass.
