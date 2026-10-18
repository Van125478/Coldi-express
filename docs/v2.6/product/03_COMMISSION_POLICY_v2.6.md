# COLDI v2.6 — Hoa hồng hai phía: business rules & ngoại lệ

> **Luật hiện hành:** [v2.7 — hoa hồng và sổ cái](../../v2.7/04_COMMISSION_POLICY_AND_LEDGER.md). COM-01 đến COM-05 và COM-07A đã duyệt. COM-06 duyệt VOID, HOLD theo phía và điều chỉnh bất biến; điều kiện hủy và ngưỡng xét vẫn mở. Các nhãn PROPOSED và OPEN trong file này là lời lúc PR #4 merge, không còn chặn các mục đã duyệt. Chưa có API commission trong source. Không có thanh toán online. Mô phỏng chỉ trong Demo/QA.

**Đã duyệt:** phương án A — tính hoa hồng riêng cho **Shipper và Carrier** trên cùng `listedPriceVnd`. Công thức, snapshot, làm tròn half-up và trạng thái ESTIMATED/ACCRUED nằm ở v2.7. Chưa có API commission/billing/settlement trong baseline. Không có thanh toán online trong MVP.

## 1. Khái niệm

- `B = listedPriceVnd`: giá cước vận tải cơ sở VND cho chuyến, số nguyên dương. KHÔNG cộng một phí hoa hồng vào B rồi tính tiếp hoa hồng phía kia (tránh tính chồng).
- `r_s`: tỷ lệ hoa hồng SHIPPER theo gói hợp lệ được xác định tại thời điểm chốt rate SHIPPER.
- `r_c`: tỷ lệ hoa hồng CARRIER theo gói hợp lệ tại thời điểm chốt rate CARRIER.
- `F_s = roundVnd(B × r_s)`: phí SHIPPER COLDI dự kiến ghi nhận.
- `F_c = roundVnd(B × r_c)`: phí CARRIER COLDI dự kiến ghi nhận.
- `Shipper obligation estimate = B + F_s`.
- `Carrier net estimate = B - F_c`.
- `COLDI gross commission accrual = F_s + F_c` (không phải lợi nhuận sau thuế/chi phí hoặc tiền mặt đã thu).

**Rounding, đã duyệt ở COM-04:** chuyển tỷ lệ sang integer basis points (5%=500bp, 4%=400bp, 3,5%=350bp). Làm tròn half-up từng bên tới 1 VND. VAT sau MVP. Câu gốc lúc merge còn nói quy tắc half-up phải chờ chốt. Với số lớn, tính bằng `BigInt` như v2.7, không dựa vào `number` JS khi có rủi ro tràn.

## 2. Ví dụ minh họa (không phải hóa đơn)

Một chuyến có **B = 10.000.000 VND**. SHIPPER gói Free (`r_s = 5%`); CARRIER Pro Monthly (`r_c = 4%`).

| Chỉ tiêu | Công thức | Kết quả minh họa |
| --- | --- | ---: |
| Cước gốc | B | 10.000.000 VND |
| Phí Shipper | B × 5% | 500.000 VND |
| Tổng trách nhiệm dự kiến Shipper | B + F_s | 10.500.000 VND |
| Phí Carrier | B × 4% | 400.000 VND |
| Giá trị ròng dự kiến Carrier | B − F_c | 9.600.000 VND |
| Tổng phí nền tảng dự kiến | F_s + F_c | 900.000 VND |

**Đây không chứng minh 10,5 triệu đã được trả, 9,6 triệu đã chuyển cho nhà xe hoặc 900 nghìn COLDI đã thu.** Phí nền tảng có thể phát sinh theo hợp đồng nhưng collection/settlement nằm ngoài MVP tự động.

## 3. Khi nào xác định tỷ lệ và căn cứ phí? — PROPOSED

| Mốc | Đề xuất xử lý | Lý do |
| --- | --- | --- |
| Shipper mở form đăng đơn | Hiển thị `B`, % gói Shipper đang áp dụng, `F_s` dự kiến và `B + F_s`; chấp thuận trước publish | Minh bạch không bất ngờ |
| Shipper publish `PUBLISHED` | **Snapshot tỷ lệ Shipper** và plan version cho đơn, cùng `B` đã công bố | Không thay đổi phí của đơn đang mở chỉ do đổi gói sau đó |
| Carrier xem chi tiết | Hiển thị cước `B`, % dự kiến theo gói Carrier, `F_c`, và net `B-F_c` trước claim | Được biết chính xác giá và fee của mình |
| Claim thành `MATCHED` | **Snapshot tỷ lệ Carrier** và plan version, tạo commission proposal cho hai bên, idempotent | Không bị tính lại khi nâng/hạ gói sau Claim |
| `MATCHED`, `IN_TRANSIT` | Phí ở trạng thái `ESTIMATED`, không nói đã thu | Chuyến có thể thất bại/hủy theo policy tương lai |
| `DELIVERY_CONFIRMED` | Có thể đổi `ESTIMATED` thành `ACCRUED/ELIGIBLE_FOR_RECONCILIATION`, **không** tự đổi sang `PAID` | Không đồng nhất giao hàng với thanh toán |
| Đối soát thủ công (nếu được duyệt) | Ghi nhận trạng thái bằng chứng/actor/timestamp riêng | Không được dùng mock payment gateway |

Đây là đề xuất thay cho 2 lựa chọn khác: (a) chốt toàn bộ rate khi Claim, hoặc (b) chốt khi delivery. **Cần chọn một policy duy nhất trước implementation**. Nếu chốt khi publish mà giá cước cho phép sửa, phải khóa snapshot hoặc yêu cầu tạo phiên bản/công bố lại đơn, tránh mất khả năng kiểm toán.

## 4. Quy tắc nguyên tử, bảo mật và minh bạch

1. Không lấy `shipperId`, `carrierId`, planId, tỷ lệ, hoặc phí từ client làm authority; tra session, shipment và gói hợp lệ phía server.
2. Record phí theo **shipment + payerSide (SHIPPER/CARRIER) + policyVersion**, unique/idempotency; retry Claim/Pickup/Delivery không sinh bản ghi phí trùng.
3. Snapshot lưu: plan id/version, rate basis points, B, fee amount, calculatedAt, effectiveAt, actor/system, policy version.
4. Tính phí trong backend, UI chỉ preview; giá hiển thị trước xác nhận Claim/post phải khớp server response.
5. Giới hạn thông tin: Shipper thấy phí của chính mình; Carrier thấy phí của chính mình; không mặc định phơi tổng revenue COLDI hay phí doanh nghiệp khác.
6. Hai khoản hoa hồng là **hai nghĩa vụ riêng**, không nhân đôi giá cước vận tải. Platform nhận khoản F_s và F_c nếu/ khi có cơ chế thu hợp lệ; tuyệt đối không thu B hai lần.
7. Nếu thiếu cấu hình hợp đồng Enterprise hoặc rate ngoài dải: **block activation/fee quote cho rate đó** hoặc dùng trạng thái NEEDS_QUOTE; không lấy midpoint âm thầm.
8. Khi hiển thị giá, cần dòng mô tả 'COLDI tính phí dịch vụ riêng cho chủ hàng và nhà xe theo gói tương ứng', được user đồng ý; **không ẩn commission trong giá cước**.
9. Giữ nguyên `DELIVERY_CONFIRMED` cho logistics; không tự thêm `COMPLETED` hay `PAID` vào shipment state hiện tại.

## 5. Hủy, hoàn, lỗi giao và khiếu nại — quyết định chưa chốt

| Tình huống | Chính sách MVP đề xuất | Cần duyệt |
| --- | --- | --- |
| Đơn `PUBLISHED` không ai Claim | Không accrue/thu hoa hồng; có thể hiển thị preview | Có cho hủy đăng đơn không? (hiện chưa có workflow) |
| Carrier Claim thua 409 | Không tạo Carrier fee, không giữ reservation, không thay phí Shipper | Có lưu audit thất bại không? |
| Driver chưa pickup và hai bên hủy | `ESTIMATED` → `VOID` nếu cho phép hủy; không tự phát sinh phí hoàn thành | Hủy chuyến, phạt hủy? |
| Đã pickup nhưng chuyến không hoàn thành | Không tự coi là phí đã kiếm; đưa ra case cần xét | Ai xác định và quyền khiếu nại? |
| Delivery đã xác nhận nhưng có tranh chấp | Phí `ACCRUED` ở trạng thái `ON_HOLD` theo phê duyệt | Có khiếu nại, time limit? |
| Trả một phần phí / miễn phí | Sử dụng adjustment có lý do/actor/audit, không sửa snapshot gốc | Ai có quyền, cách phê duyệt? |
| Gói hết hạn giữa đường | Giữ nguyên rate snapshot của shipment đã Claim; không khóa hoàn thành | Có grace period? |
| B thay đổi sau publish | Không cập nhật lặng lẽ; yêu cầu policy re-publish có consent hoặc từ chối sửa | Giá có được sửa? |
| API lỗi khi ghi phí | Không tạo trạng thái giao hàng mâu thuẫn; transactional/outbox hoặc retry idempotent | Công nghệ cụ thể |
| Chênh lẻ làm tròn | Dùng một rounding policy theo mỗi bên, không dùng round ngẫu nhiên phía FE | Half-up/ceil/floor? |

## 6. Dữ liệu gợi ý (không phải schema đã được duyệt)

`CommissionPolicyVersion`, `ShipmentCommissionSnapshot` (2 rows/payer sides), `CommissionAccrual`/`CommissionAdjustment`, `ManualReconciliationReference` (chỉ nếu có xác nhận thủ công được duyệt), `PlanAssignment`, `PlanPriceSnapshot`.

Không lẫn với `Shipment.events` hoặc `AuditLogs` hiện tại. Nếu cần materialized summaries, luôn truy ngược được tới record gốc và có khóa idempotency.

## 7. Acceptance tối thiểu

- 5%+4% trên 10.000.000 ra 500.000 và 400.000; hiển thị ba con số gốc/fee/tổng-net minh bạch.
- Thay gói giữa `PUBLISHED/MATCHED/IN_TRANSIT` không đổi snapshot chuyến cũ.
- Hai Claim đồng thời có đúng một bên được tạo fee snapshot; 409 không tạo fee.
- Retry delivery không tăng phí; lỗi storage không bỏ phí hoặc duplicate; backfill có audit.
- Không xem hoặc sửa được commission record của account khác.
- Chưa có payment online thì UI KHÔNG nói 'Đã thanh toán' hoặc 'Đã nhận tiền'.

## 8. Cần Product Owner ký trước khi coding

Chốt bảng giá cuối, có thu cả hai phí thật hay chỉ trình bày dự kiến ở MVP, căn cứ `B`, snapshot moment, precision/rounding, cancellation/dispute handling, manual reconciliation authority, quyền truy cập thu phí, chính sách công bố chi tiết bảng giá. **A (thu hai phía) là định hướng đã chọn, không mặc nhiên đồng nghĩa tất cả rule đề xuất trong file này đã duyệt.**
