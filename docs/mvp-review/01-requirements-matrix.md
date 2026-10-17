# MVP-01 — Ma trận yêu cầu

Ngày rà soát: 2026-10-17. Nhánh `feature/cinematic-scroll`, HEAD `69ec1a198f0729efc10a3d534dd92d264b1738eb`.

Nguồn duyệt: sáu tài liệu trong `Coldi_Documentation_v2.3/`. Ảnh trong `Asset/coldi/` chỉ là tham chiếu giao diện. Một ảnh không chứng minh một quy tắc nghiệp vụ đã được duyệt.

Đợt này không chạy lại test và không ghi database. Mã nguồn có 45 lời gọi `test(` trong `server/tests/`. Lần chạy đầy đủ gần nhất, trong lượt triển khai Core 13 ngay trước rà soát này, báo 45 pass và 0 fail. Kết quả đó không được coi là nghiệm thu tay.

Web không có Vitest, Playwright hay runner test giao diện trong `web/package.json`.

## Cách đếm

32 yêu cầu. Mỗi yêu cầu một trạng thái.

| Trạng thái | Số |
| --- | ---: |
| IMPLEMENTED AND AUTOMATED TESTED | 13 |
| IMPLEMENTED BUT NOT MANUALLY TESTED | 5 |
| PARTIALLY IMPLEMENTED | 3 |
| NOT IMPLEMENTED | 3 |
| BLOCKED BY DECISION | 5 |
| OUT OF MVP SCOPE | 3 |

Các mục đã có test API vẫn chưa có nghiệm thu tay trên trình duyệt. Bảng không gộp hai việc đó thành “xong”.

M14 được sửa sau MVP-03. M17 chuyển từ BLOCKED BY DECISION sang IMPLEMENTED BUT NOT MANUALLY TESTED sau MVP-04, nên hai số đếm tương ứng ở trên là 5 và 5. Các số còn lại giữ kết quả rà soát lúc viết.

## Ma trận

| ID | Yêu cầu | Nguồn | Vai trò | Phân loại | Hiện trạng | Backend | Frontend | Test tự động | Test tay | Trạng thái | Khoảng trống | Mức | Việc tiếp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M01 | Đăng nhập cookie, đăng xuất, từ chối origin lạ | Master §7.4; handoff kỹ thuật phiên | Cả bốn | MVP | Cookie `coldi_session`, HttpOnly | `server/src/routes/auth.routes.ts` | `/dang-nhap` | `auth.test.ts` | Chưa trong đợt 09–13 | IMPLEMENTED AND AUTOMATED TESTED | Chưa nghiệm thu lại trên máy mới | P2 | Giữ nguyên khi đóng gói |
| M02 | Đúng bốn vai trò, mỗi tài khoản một `role` | Master §1; Decisions D-01 | Cả bốn | MVP | `User.role` một giá trị | `server/src/models/user.ts` | `RoleGate` | `auth.test.ts`, `security.test.ts` | Chưa | IMPLEMENTED AND AUTOMATED TESTED | Khác Role Switcher ở M03 | — | Không thêm role |
| M03 | Role Switcher trên một tài khoản | Master §1 và §4.1 bước 1 | Cả bốn | Xung đột tài liệu | Không có switcher. Handoff còn ghi active tenant là TBD | Không có membership | Không có | Không | Không | BLOCKED BY DECISION | Master nói switcher; mô hình đang chạy là một role | P2 sau khi duyệt | Không bịa tenant.active |
| M04 | Chủ hàng đăng đơn, sang PUBLISHED | Master §4.1 bước 1; D-05 | SHIPPER | MVP | `POST /api/shipments` tạo PUBLISHED | `shipment.routes.ts` | `/shipper/tao-don` | `shipment.test.ts` | Core 06/07 đã từng nghiệm thu đơn cũ; form mới chưa được rà lại | IMPLEMENTED AND AUTOMATED TESTED | Không có bản nháp lưu riêng | — | Giữ luồng đăng thẳng |
| M05 | Trạng thái DRAFT “Bản nháp” | Master §4.2 | SHIPPER | Có trong bảng trạng thái, không có trong 7 bước MVP | Enum có DRAFT, không có API lưu nháp | `shipment.ts` | Không | Không | Không | NOT IMPLEMENTED | Không chặn đăng đơn | P3 | Chỉ làm nếu chủ sản phẩm yêu cầu nháp |
| M06 | Sàn PUBLISHED: tìm, lọc, sắp xếp | Master §2.2, §4.1 bước 2; Phụ lục E | CARRIER | MVP | Allowlist query, tối đa đọc 500 và trả 100 | `marketplaceQuery.ts`, `GET /api/carrier/shipments` | `/carrier/tim-chuyen` | `marketplace.test.ts` | Chưa | IMPLEMENTED AND AUTOMATED TESTED | Chưa phân trang, chưa tìm không dấu | P2 | Không chặn pilot nhỏ |
| M07 | So sánh chuyến | Master §2.2 | CARRIER | MVP đọc | Chọn tối đa hai chuyến trong bộ nhớ trang | Không có API | `CarrierLoadBoard.tsx` | Không có test UI | Chưa | IMPLEMENTED BUT NOT MANUALLY TESTED | Mất khi tải lại; không phải bookmark | P2 | Nghiệm thu tay mục G |
| M08 | Gọi và chat không Claim | Master §4.1 bước 3; D-02 | CARRIER, SHIPPER | MVP | Chat riêng theo cặp đơn–nhà xe | `carrierConversation.routes.ts` | `CarrierChat`, `tel:` | `chat.test.ts`, `marketplace.test.ts` | Chưa trên UI | IMPLEMENTED AND AUTOMATED TESTED | Giữ chỗ thua cuộc là quy tắc tạm, xem M-chat trong quyết định | — | Không đổi quyền chat nếu chưa duyệt |
| M09 | Claim nguyên tử, một người thắng, 409 | Master §4.1 bước 4–5; D-02 | CARRIER | MVP | `findOneAndUpdate` điều kiện PUBLISHED và chưa có nhà xe | `POST .../claim` | Sau khi xác nhận | `claim.test.ts`, `security.test.ts`, `marketplace.test.ts` | Chưa lại trên UI | IMPLEMENTED AND AUTOMATED TESTED | Khóa Claim không bị viết lại ở Core 13 | — | Giữ test tranh chấp |
| M10 | Popup xác nhận trước khi gửi Claim | Phụ lục E3 | CARRIER | MVP UI | `ClaimConfirm` trên sàn và chi tiết | Không gửi request khi mở | `ClaimConfirm.tsx` | Không | Chưa | IMPLEMENTED BUT NOT MANUALLY TESTED | Chưa có test trình duyệt | P1 quy trình | Nghiệm thu tay mục J–K |
| M11 | Gán xe và tài xế thuộc nhà xe, trạng thái vẫn MATCHED, nhãn “Chờ lấy hàng” | D-03; `shipmentStatusLabel` | CARRIER | MVP | Xe và driver phải cùng `carrierId` | `POST .../assign` | `/carrier/chuyen-cua-toi` | `assignment.test.ts` khẳng định nhãn | Chưa lại | IMPLEMENTED AND AUTOMATED TESTED | Không khóa một xe chỉ một chuyến | P2 | Không thêm độc quyền xe nếu chưa duyệt |
| M12 | Tài xế chỉ thấy chuyến được gán; lấy và giao là nút tường minh | D-04; Master §4.1 bước 7 | DRIVER | MVP | Lấy chuyển IN_TRANSIT; giao chuyển DELIVERY_CONFIRMED. GPS không tự đổi trạng thái | `driverShipment.routes.ts` | `/driver/chuyen/:id` | `driver.test.ts` | Chưa lại | IMPLEMENTED AND AUTOMATED TESTED | Master liệt kê PICKUP_CONFIRMED như một status; code ghi event PICKUP_CONFIRMED rồi để status IN_TRANSIT | P2 ghi chú | Giữ hành vi đã test. Đừng thêm status đứng yên nếu chưa có quyết định mới |
| M13 | Timeline năm sự kiện ghi khi nghiệp vụ thành công | Master §4.2; Core 07 | Ba vai trò vận hành | MVP | PUBLISHED, CLAIMED, ASSIGNED, PICKUP_CONFIRMED, DELIVERY_CONFIRMED | `shipmentEvents.ts` | `ShipmentTimeline` | `timeline.test.ts` | Core 07 đã nghiệm thu hai đơn cũ | IMPLEMENTED AND AUTOMATED TESTED | GET không ghi event | — | Không đổi semantics |
| M14 | Câu ASSIGNED giữ đúng xe tại thời điểm gán | Master §4.2 “nguồn sự thật” | Người xem timeline | MVP hiển thị | Lần gán mới lưu `assignedVehicleLabel` và `assignedDriverName`. Event cũ không có hai field vẫn đọc tên hiện tại | `shipmentEvents.ts`, `carrierShipment.routes.ts` | Timeline dùng `detail` từ API | `integration.test.ts` | Chưa bấm tay | IMPLEMENTED AND AUTOMATED TESTED | Event cũ không có snapshot vẫn đổi câu theo tên hiện tại | — | Xem `08-timeline-history-fix.md` |
| M15 | GPS khi IN_TRANSIT, chủ hàng đọc vị trí của đơn mình | Master §5; D-04 | DRIVER, SHIPPER | MVP dữ liệu | Upload từ chối ngoài IN_TRANSIT. `GET /api/shipments/:id/location` trả chủ đơn, chủ hàng khác 403 | `driverShipment.routes.ts`, `shipment.routes.ts` dòng 65–80 | `getShipmentLocation` | `gps.test.ts`, `security.test.ts` | Chưa trên trình duyệt | IMPLEMENTED AND AUTOMATED TESTED | Chưa có tọa độ kho | — | Không suy lấy/giao từ tọa độ |
| M16 | Chủ hàng thấy thời điểm và phase; tài xế chia sẻ khi đang vận chuyển | Master §5 “không trình bày dữ liệu cũ như trực tiếp” | SHIPPER, DRIVER | MVP | Poll 90 giây. Phase current/stale/ended. Panel tài xế gắn khi IN_TRANSIT | DTO `toTrackingDto` | `ShipmentLocation.tsx`, `DriverTripDetail.tsx` dòng 141 | Không test trình duyệt | Chưa | IMPLEMENTED BUT NOT MANUALLY TESTED | Quyền vị trí, nền tab, mất sóng chưa được bấm thử | P1 quy trình | Nghiệm thu GPS trên trình duyệt |
| M17 | Live Map địa lý | Master §5. Chủ sản phẩm chọn Mapbox GL JS v3 cho MVP này | SHIPPER | MVP | Mapbox GL JS 3.33.0. Bản đồ chỉ tạo khi chủ hàng bấm mở và có token `pk.` | API GPS không đổi | `ShipmentLiveMap.tsx`, `ShipmentLocation.tsx` | `mapboxMap.test.ts` cho thứ tự tọa độ, trạng thái, token và một instance | Chưa bấm tile | IMPLEMENTED BUT NOT MANUALLY TESTED | Chưa có token thật nên chưa thấy tile hay marker trên trình duyệt | P1 nghiệm thu | Xem `09-mapbox-live-map.md`. Không thêm ETA hay lộ trình |
| M18 | Adaptive Ping, kể cả gần kho 1 phút | Master §5.1 | DRIVER | MVP tham chiếu | Policy test đúng mốc 15 phút và 3–5 phút / 2 km. Gần kho luôn `unavailable` | `server/src/gps/pingPolicy.ts` | Bản trùng ở web | `gps.test.ts` test policy | Chưa | PARTIALLY IMPLEMENTED | Thiếu tọa độ kho nên không áp dụng nhánh 1 phút | P2 | Không bịa tọa độ |
| M19 | Nhà xe quản lý xe của mình và sửa tên tài xế đã liên kết | Phụ lục E, F; D-07 chỉ là đề xuất | CARRIER | MVP danh sách | Create/update xe, PATCH tên. Không có DELETE | `carrierFleet.routes.ts` | `/carrier/doi-xe` | `fleet.test.ts` | Màn thêm/sửa chưa nghiệm thu tay | IMPLEMENTED AND AUTOMATED TESTED | API đã test; UI chưa | — | Xem M20 |
| M20 | Màn đội xe và lối vào Đội xe | Phụ lục E | CARRIER | MVP UI | Nav có `/carrier/doi-xe` | Như M19 | `WorkspaceLayout.tsx`, `carrier/fleet/` | Không | Chưa | IMPLEMENTED BUT NOT MANUALLY TESTED | Đăng kiểm không được dùng để chặn gán | P2 | Nghiệm thu thêm/sửa xe |
| M21 | Tạo tài khoản tài xế và gắn nhà xe | Decisions mục 3, nhóm Driver | CARRIER, ADMIN | Chưa chốt | Chỉ seed hoặc user có sẵn `carrierId` | `seedDemoFleet.ts` | Không có màn mời tài xế | Seed không được chạy trong rà soát | Không | BLOCKED BY DECISION | Nhà xe thật không thêm được tài xế mới | P1 sau khi duyệt quy trình | Demo vẫn dùng seed |
| M22 | Xóa hoặc ngừng dùng xe | Không có quyết định | CARRIER | Chưa chốt | Không có endpoint xóa | Express trả 404 | Không có nút xóa | Không | Không | BLOCKED BY DECISION | Xe cũ vẫn gán được | P2 | Không xóa bản ghi khi chưa có quy tắc |
| M23 | Audit sau ghi nghiệp vụ thành công | Master §7.2 | Hệ thống | MVP tối thiểu | Tám action thành công. Không có API đọc audit | `recordAudit.ts` | Không | `security.test.ts` | Chưa xem trên UI, và không có UI | IMPLEMENTED AND AUTOMATED TESTED | Thiếu tenant_id, thiếu tra cứu | — | Không mở GET công khai |
| M24 | Audit không mất khi tiến trình chết giữa ghi đơn và ghi log | Master §7.2 “bắt buộc” | Hệ thống | Production | Lỗi insert, trừ trùng 11000, bị nuốt. Mongo standalone không có transaction đa document | `recordAudit.ts` dòng 24–44 | Không | Test một lần thành công, không test crash | Không | PARTIALLY IMPLEMENTED | Cửa sổ mất log | P2 trước production | Không làm yếu Claim để chờ audit |
| M25 | Mọi query ràng buộc `tenant_id` | Master §7.1 | Doanh nghiệp | MVP chữ, mô hình chưa duyệt | Không có Organization hay `tenant_id`. Quyền đang là role và quan hệ đơn | Các route hiện có | RoleGate | `security.test.ts` chứng minh cách ly quan hệ, không chứng minh tenant tổ chức | Không | BLOCKED BY DECISION | Không được gọi là multi-tenant xong | P0 nếu coi thiếu tenant là lỗ hổng đã chứng minh: chưa chứng minh được lỗ đọc chéo | Chờ quyết định tổ chức |
| M26 | Tài liệu cài đặt cho đồng đội | Core 08 | Nhóm | MVP vận hành | `README.md` và `server/README.md` vẫn viết GPS, chat, đội xe chưa làm. Đúng với commit HEAD, sai với working tree | — | — | Không | Đọc đối chiếu | PARTIALLY IMPLEMENTED | Clone HEAD không có Core 09–13 | P1 phát hành | Cập nhật tài liệu sau khi commit từng cụm |
| M27 | Hủy, phân công lại, COMPLETED, INCIDENT | Master §4.2; Decisions mục 3 | Vận hành | Chưa chốt | Enum có mã. Không có chuyển trạng thái | Không | Admin nói khu chưa mở | Không | Không | BLOCKED BY DECISION | Giao xong dừng ở DELIVERY_CONFIRMED | — | Không tự hoàn tất hay thu tiền |
| M28 | Admin duyệt KYC và xử lý sự cố | Master §1, §3 | ADMIN | Chưa có danh sách API | `/admin` chỉ là thông báo chưa mở | Không có router admin nghiệp vụ | `AdminHome.tsx` | Admin bị 403 ở sàn, GPS, chat | Nhìn mã | NOT IMPLEMENTED | Đúng với quyết định Core 12 không mở đọc toàn bộ | P2 | Không thêm đọc tất cả |
| M29 | Công nợ, Net 30, hạn mức, escrow, tạm ứng | Master §6; Finance §2; D-06 | Kinh tế | CHỜ DUYỆT | UI không ghi nhận thanh toán. Cước niêm yết là số trên đơn | Không | Cấm widget giả | Test nói giao không phải thanh toán | Không | OUT OF MVP SCOPE | Ảnh SOA không được code | — | Không làm |
| M30 | Geofence, seal, e-POD, IoT, ETA | D-08; Master §5 | Vận hành | PHASE 2 | Không có | Không | Không | Không | Không | OUT OF MVP SCOPE | — | — | Không làm |
| M31 | Giá dầu, tiệm sửa, bookmark vĩnh viễn | Phụ lục E gọi giá dầu/gara là prototype | CARRIER | Prototype | Không có nút. So sánh không lưu tài khoản | Bookmark giả trả 404 trong test | Không | `marketplace.test.ts` | Không | OUT OF MVP SCOPE | — | — | Không làm |
| M32 | App iOS/Android cùng tài khoản web | Master §1, §4.1 | Cả bốn | MVP kiến trúc nền tảng | Repo này là web | Không | Không | Không | Không | NOT IMPLEMENTED | Xung đột với phạm vi các core web đã làm | P3 với đợt đóng web | Không mở dự án native trong đợt này |

## Xung đột tài liệu, không tự xử

1. Master §4.1 yêu cầu Role Switcher. Code và D-01 thực tế đang là một tài khoản một role. Handoff còn để active tenant là TBD. M03 giữ BLOCKED.
2. Master §4.2 có status `PICKUP_CONFIRMED`. Luồng đã test ghi event `PICKUP_CONFIRMED` và status `IN_TRANSIT`. Khớp bước 12–13 của yêu cầu rà soát này. Không đổi trong đợt đóng trừ khi chủ sản phẩm muốn một status đứng riêng.
3. Chủ sản phẩm đã chọn Mapbox GL JS v3 cho Live Map của MVP. Goong không dùng cho bản đồ này. Tile và marker thật chưa được bấm. Chi tiết ở `09-mapbox-live-map.md`.
4. Master §7.1 bắt `tenant_id`. Decisions và Core 12 chưa có quy tắc tổ chức. Test hiện chứng minh cách ly theo quan hệ, không chứng minh tenant.
5. `README.md` dòng 5 nói GPS, chat và đội xe chưa làm. Câu đó đúng với commit `69ec1a1` và sai với cây làm việc chưa commit.
