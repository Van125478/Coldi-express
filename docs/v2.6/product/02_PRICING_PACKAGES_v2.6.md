# COLDI v2.6 — Bảng giá gói & quyền lợi (PHƯƠNG ÁN ĐỀ XUẤT)

**Nguồn:** 4 ảnh Shipper/Carrier do Product Owner gửi ngày 18/10/2026. **Chưa duyệt thành giá niêm yết chính thức, chưa cho phép tự động thu phí**. Những quyền lợi có trong ảnh nhưng chưa có code được ghi đúng là planned/conditional.

## 1. Bảng gói Shipper (4 tiers)

| Gói | Giá hiển thị đề xuất | Hoa hồng Shipper / chuyến hoàn thành | Phạm vi |
| --- | ---: | ---: | --- |
| Free | 0 VND/tháng | 5% | Tạo/đăng đơn, xem danh sách Carrier, thông tin và trạng thái đơn, lịch sử cơ bản, chat/hỗ trợ, GPS cơ bản theo chuyến, quản lý đơn |
| Pro Monthly | 799.000 VND/tháng | 4% | Free + lọc nâng cao theo tải trọng/tuyến/nhiệt/thời gian, theo dõi nhiều chuyến, lịch sử chi tiết, báo cáo cơ bản, hỗ trợ ưu tiên, tiện ích quanh tuyến (cần đối tác/API) |
| Pro Annual | 7.990.000 VND/năm | 3,5% | Pro Monthly + báo cáo tổng hợp tháng/quý, xuất báo cáo, ưu tiên xử lý, hỗ trợ thiết lập |
| Enterprise | 5–15 triệu VND/tháng trở lên (báo giá) | 2–3% (theo hợp đồng) | Pro Annual + đa chi nhánh/tài khoản, phân quyền, báo cáo tùy chỉnh, API/ERP theo hợp đồng, SLA/nhân sự hỗ trợ |

**Cảnh báo:** Giá/rate Enterprise là dải thỏa thuận. Không dùng giá hoặc rate trung bình nếu chưa có con số theo hợp đồng.

## 2. Bảng gói Carrier (5 tiers)

| Gói | Giá hiển thị đề xuất | Quy mô xe mô tả trong ảnh | Hoa hồng Carrier / chuyến hoàn thành | Phạm vi |
| --- | ---: | --- | ---: | --- |
| Free | 0 VND/tháng | 1–2 xe | 5% | Tạo hồ sơ, đăng thông tin xe, xem sàn, điểm lấy/giao & tải trọng, giá cước đủ để quyết định, chat, claim thủ công, quản lý chuyến/đội xe cơ bản |
| Pro Monthly | 999.000 VND/tháng | 3–10 xe | 4% | Free + lọc nâng cao, quản lý nhiều xe/tài xế, phân công, dashboard nhiều chuyến GPS, báo cáo tuần/tháng, ưu tiên hỗ trợ, tiện ích tuyến đường |
| Pro Annual | 9.990.000 VND/năm | 3–10 xe | 3,5% | Pro Monthly + báo cáo theo tháng/quý, xuất dữ liệu vận hành, báo cáo hiệu quả/chi phí khi đủ dữ liệu, hỗ trợ thiết lập |
| Business | 2–5 triệu VND/tháng | 11–30 xe | 2,5–3% (theo hợp đồng) | Pro Annual + quản lý đội xe nhiều tài xế, phân quyền điều phối, dashboard tổng hợp, báo cáo chi phí/vận hành nâng cao, ưu tiên hỗ trợ |
| Enterprise | 5–20 triệu VND/tháng trở lên (báo giá) | Trên 30 xe | 1,5–2,5% (theo hợp đồng) | Business + nhiều chi nhánh, phân quyền nhiều cấp, báo cáo tùy chỉnh, API/ERP, SLA/hỗ trợ hợp đồng |

## 3. Phân loại quyền lợi trong ảnh để tránh hứa sai

| Quyền lợi | Tình trạng code hiện tại | Đề xuất ghi trong ứng dụng |
| --- | --- | --- |
| Tạo đơn, tìm/claim, chat, fleet, assign, status, GPS theo chuyến | Có code logistics, E2E pending | Có thể ghi: đang chạy trên bản Team Testing; chưa công bố production |
| Lọc marketplace hiện có, xem cước chi tiết | Có trong Carrier code | **Không thu hồi đột ngột quyền cốt lõi** của Free; nếu muốn phân hạng lọc, phải phê duyệt mức nâng cao thật |
| GPS cơ bản cho chủ đơn/nhà xe nhận chuyến | Có API theo RBAC, map thật chưa UAT | Là quyền vận hành cơ bản, không khóa sau khi Claim |
| Lịch sử định tuyến GPS đa điểm, route ETA | Chưa có | Không được quảng cáo như đã hoạt động |
| Chỉ số doanh thu/chi phí và xuất report nâng cao | Chưa có nghiệp vụ tài chính đầy đủ | Chỉ hiện quyền lợi nếu đã code & test; còn lại gắn planned |
| Garage/quán ăn/ưu tiên hiển thị/sales lead | Chưa có API/đối tác/criteria | Dời/hủy cam kết khỏi MVP nếu chưa được duyệt |
| Đa chi nhánh, nhiều user/Organization, API/ERP | Chưa có schema tổ chức | Enterprise mô tả theo hợp đồng, **không bật feature giả** |
| SLA/hỗ trợ ưu tiên | Cần định nghĩa dịch vụ vận hành | Chỉ công bố khi có nhân sự, kênh và thời hạn phản hồi thực |

## 4. Cap và quota — DRAFT đề xuất, phải chốt

Các dải `1–2`, `3–10`, `11–30`, `>30` trong ảnh là **quy mô gợi ý**, **chưa tự động là hard-limit**. Nếu Product Owner duyệt chúng là cap, đề xuất: Free <=2 xe, Pro <=10, Business <=30, Enterprise theo hợp đồng; không yêu cầu khách phải đủ 3 xe mới mua Pro hoặc đủ 11 xe mới mua Business.

Shipper trong ảnh **không có quota số đơn/tháng**; không được tự đặt `5 đơn/tháng` hoặc số bất kỳ. Những tính năng lọc/tổng hợp/ưu tiên muốn phân tier phải có ranh giới định lượng được duyệt.

## 5. Tách hai loại phí

- **Subscription fee:** 799k/999k theo tháng, gói năm, phí báo giá. **Chưa có thanh toán online.** Admin chỉ cấp gói sau khi có cơ chế xác nhận hợp lệ được phê duyệt.
- **Trip commission:** phí theo **một chuyến** có căn cứ xác nhận hoàn thành, riêng từng phía. Dùng hai mức rate độc lập theo gói và snapshot; xem [Commission Policy](03_COMMISSION_POLICY_v2.6.md).

Không hiển thị phần trăm hoa hồng như tiền đã thu nếu chưa đối soát/thu tiền. Bảng giá không thay thế hợp đồng dịch vụ.
