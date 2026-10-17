# COLDI FE-05A — Visual Acceptance Register & Carrier Backlog

> **Ngày:** 17/10/2026 · **Nhánh:** `integration/coldi-v2.3-mvp` · **Trạng thái:** TẤT CẢ CHƯA ĐƯỢC CHỦ DỰ ÁN VISUAL ACCEPTED.  
> **Nguồn:** Screenshot người dùng và báo cáo Cursor trong phiên review. Đây là nhận xét theo ảnh và báo cáo, **không phải kết quả test browser tự động do tài liệu này thực hiện**.

## 1. Ma trận nghiệm thu

| Màn | Route | Bằng chứng / đánh giá hiện tại | Trạng thái |
| --- | --- | --- | --- |
| Carrier Home | `/carrier` | Có ảnh đầu/cuối trang; sidebar navy ổn; vùng shortcut có thể trùng nav; các chuyến đã nhận đang hiển thị thật | Review P2 |
| Carrier Marketplace thật | `/carrier/tim-chuyen` | 0 chuyến PUBLISHED, empty state hợp lý; search/filter khá cao; còn định dạng date theo browser | Review P1 |
| Marketplace card | Cùng trang, nguồn API PUBLISHED | Preview DEV ba cột ở 1440/1280 đã xem; spacing, giá, CTA không tràn. Chưa có shipment PUBLISHED thật để thử click-through | Review P1 / cần dữ liệu test |
| Carrier Detail | `/carrier/chuyen/:id` | Screenshot đã thấy cải thiện status/route/price; còn thiếu dữ liệu, chữ lặp, fallback map. Timeline hiện mốc đã ghi | Review P1–P2 |
| Carrier Trips | `/carrier/chuyen-cua-toi` | Có code/báo cáo; chưa nghiệm thu đầy đủ danh sách và modal phân công lượt cuối | Pending |
| Carrier Fleet/Drivers | `/carrier/doi-xe`, `/carrier/doi-xe/tai-xe` | Có code/báo cáo; chưa review ảnh màn cuối | Pending |
| Shipper Home / Detail | `/shipper`, `/shipper/don-hang/:id` | Có screenshot Shipper Home; nhìn tổng thể ổn, cần polish ngôn ngữ/vị trí cuối; Mapbox tiles chưa nghiệm thu | Pending |
| Driver Home / Detail | `/driver`, `/driver/chuyen/:id` | Screenshot cho thấy nội dung desktop hẹp và bảng chữ; cần polish. Sidebar đã được báo fix | Pending |
| Guest + Login | `/`, `/dang-nhap` | Cinematic giữ nguyên; UI Login cần đồng bộ nhận diện, chưa nghiệm thu | Pending |
| Register | `/dang-ky` | Route chưa tạo tài khoản, không advertise như tính năng hoạt động | Future scope |

## 2. Danh sách sửa Carrier sau vòng nghiệm thu

### P1 — cần trước khi kết luận giao diện Carrier đạt

1. **Một Marketplace thật duy nhất:** code working tree đã bỏ preview khỏi UI. `/carrier/tim-chuyen` render lưới từ PUBLISHED khi có dữ liệu; 0 đơn → empty state. Lưới ba thẻ với đơn thật **chưa được bấm** vì sàn phát triển đang có 0 PUBLISHED.
2. **CTA fixture:** đã gỡ. Không còn `Xem đơn` trỏ `#bo-cuc-khong-phai-don`. Đơn thật mở `/carrier/chuyen/:id`. Chưa có đơn PUBLISHED để bấm đường đó trên trình duyệt.
3. **Bộ lọc quá cao:** code đã để ô tìm, nhóm nhiệt và sắp xếp ở trên; điểm lấy, điểm giao, tải trọng và ngày lấy nằm trong “Bộ lọc khác”. Chưa visual accepted.
4. **Phân biệt lỗi tải và không có đơn:** code có error + thử lại, tách khỏi empty. Phiên trình duyệt API khỏe nên chưa kích hoạt lỗi.
5. **Card thật click-through:** vẫn cần một đơn PUBLISHED trong môi trường được phép ghi. Không tạo shipment vào DB chỉ để chụp UI.

### P2 — polish có giới hạn

6. Carrier Home: bốn ô lối tắt trùng sidebar đã bỏ khỏi trang. Route sidebar, tìm kiếm, nhóm nhiệt, chuyến đang theo dõi và chuyến đã nhận còn. Chưa visual accepted.
7. Detail: số đo trống được gom một câu khi cả khối lượng, thể tích và số kiện đều thiếu. Tên đã bắt đầu bằng “Tài xế” không bị thêm nhãn nữa. Chưa visual accepted.
8. Detail: một câu nói chưa gắn được vị trí hai địa chỉ. Không có canvas tuyến. Tọa độ vẫn chưa có.
9. Timeline: tên mốc, time và actor rõ ràng; không sinh các mốc legacy thiếu; không lộ `MATCHED`.
10. Nếu chỉnh shared sidebar/header/logo, kiểm tra regression trên 3 role cả khi cuộn trang ở 1280/1440.

## 3. Checklist ảnh để user tự nghiệm thu Carrier

**Thiết lập:** Chrome zoom 100%; desktop viewport 1440px và kiểm tra lại 1280px. Chụp cả sidebar/header, đầu và cuối trang nơi cần quan sát. Phiên review này đọc dữ liệu, không Claim/Assign/Send Chat/Upload GPS/Create Driver/Edit Vehicle.

- [ ] `C-01` `/carrier` đầu trang (search, shortcuts, status, sidebar).
- [ ] `C-02` `/carrier` cuối trang sau scroll (đơn đã nhận, sticky sidebar/header).
- [ ] `C-03` `/carrier/tim-chuyen` search + filter + empty/error state thực.
- [ ] `C-04` `/carrier/tim-chuyen?xem-truoc-bo-cuc=1` không còn thẻ mẫu và không còn hash `#bo-cuc-khong-phai-don`.
- [ ] `C-05` Lưới ba thẻ từ đơn PUBLISHED thật ở 1440 và 1280. **Blocked** khi sàn đang có 0 đơn. Không dùng thẻ mẫu để thay.
- [ ] `C-06` `/carrier/chuyen/:id` đầu trang (route/status/giá/vị trí/ hàng hóa).
- [ ] `C-07` `/carrier/chuyen/:id` giữa và cuối trang (phân công/chat/map fallback/timeline).
- [ ] `C-08` `/carrier/chuyen-cua-toi` nhóm trạng thái và nút hành động (không commit nghiệp vụ).
- [ ] `C-09` `/carrier/doi-xe` danh sách/chi tiết xe.
- [ ] `C-10` `/carrier/doi-xe/tai-xe` danh sách/chi tiết tài xế.
- [ ] `C-11` logo/sidebar ở 1280 và 1440, gồm trường hợp cuộn sâu và deep-link.

## 4. Cách đánh dấu kết quả

- **Visual accepted — user confirmed:** chỉ khi user xác nhận trực tiếp đối với phiên bản/screenshot cụ thể.
- **Needs changes:** có lỗi bằng chứng rõ ràng; ghi component, ảnh và mức ưu tiên; không đánh dấu code failed nếu chỉ lệch thiết kế.
- **Blocked / Needs evidence:** chưa có dữ liệu PUBLISHED, token Mapbox hoặc kiểm tra đúng quyền; không tự giả lập thành công.
- **Code/test passed:** ghi nguồn và lệnh thực tế; không thay thế visual accepted.

## 5. Tình trạng kỹ thuật đã báo cáo (chưa tái chạy tại đây)

- Remote HEAD đã kiểm tra trong phiên: `76a12713a7a6a68cfd8998337b86f4588adc1956`.
- Cursor FE-05A `USER REVIEW FOLLOW-UP`: báo web lint, `tsc -b`, production build pass; backend không đổi, baseline backend báo 67 pass ở lượt trước. File FE-05A mới đang uncommitted trong Cursor.
- Không nghiệm thu Mapbox tiles/marker thật; không nghiệm thu signup; chưa chạy FE-05B.
- Cursor có thể xử lý Shipper/Driver/Login ở prompt kế tiếp trong lúc user đánh giá Carrier; phải giữ nguyên diff chưa commit và không làm Carrier regression.

## 6. Exit criteria trước FE-05B

- Vòng UI chủ dự án xác nhận hoặc liệt kê rõ ngoại lệ đã chấp nhận cho các màn MVP chính.
- Có bằng chứng ít nhất các tuyến/CTA chính không lỗi trên desktop, khả năng đọc/điều hướng và trạng thái loading/error/empty.
- Preview/fixture không rò vào production, không hiển thị như đơn thật.
- Luồng nghiệm thu ghi dữ liệu phải được user cho phép và dùng bộ dữ liệu test riêng; không sửa các đơn demo cần bảo tồn.
- Đánh dấu Mapbox E2E là pending cho đến khi có token & tọa độ thật.

**Không tự commit/push, không đánh dấu accepted, không thay đổi RBAC/account/DB dựa trên trang review này.**

## 7. Việc đã ghi sau khi gỡ preview

Working tree sau lượt Carrier polish, vẫn trên HEAD commit `76a12713a7a6a68cfd8998337b86f4588adc1956`, chưa commit:

- Preview không còn trong UI và không còn file thẻ mẫu.
- Bộ lọc nâng cao thu gọn. Allowlist query không đổi.
- Trang chủ nhà xe không còn bốn ô trùng menu.
- Chi tiết nhà xe gom chỗ trống và câu bản đồ ngắn hơn.
- Đăng ký, dấu xác thực và WAREHOUSE chỉ được ghi ở `docs/product/COLDI_v2.4_Product_Decisions_2026-10-17.md`. Chưa có API, field hay role mới.

Không màn nào trong bảng mục 1 được chuyển sang visual accepted.
