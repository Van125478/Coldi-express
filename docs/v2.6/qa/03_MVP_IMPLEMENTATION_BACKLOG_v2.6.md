# COLDI v2.6 — Backlog triển khai MVP

**Loại:** kế hoạch giao việc. **Không phải** lệnh triển khai và **không phải** biên bản đã code.

**Baseline:** `main` `7d07e941ace1d3490996c53a6bed36478a6d4836`. Không đặt deadline hay story point vì chưa có số liệu năng lực nhóm.

> **Cập nhật v2.7:** bảng quyết định phía dưới ghi trạng thái lúc soạn backlog trên baseline `7d07e941`. PKG-01, PKG-02, PKG-03, PKG-06B, PKG-07 và COM-01 đến COM-07A đã được duyệt tại [v2.7](../../v2.7/01_DECISIONS_AND_SCOPE.md). Các dòng còn ghi OPEN cho những ID đó là lịch sử kế hoạch, không còn là điều kiện chặn. Quota đơn, Premium, hợp đồng Enterprise, nâng gói giữa kỳ, dầu OIL-02 đến OIL-04 và INC-01 đến INC-04 vẫn chặn code của phần đó. Chưa triển khai module.

**Quy tắc đọc gốc lúc soạn backlog:** APPROVED DIRECTION không biến bảng giá, công thức, hạn mức hay phân quyền chi tiết thành rule đã duyệt. Câu đó đúng vào lúc v2.6. Nó không hủy các mục v2.7 đã ghi APPROVED.

## Phân loại nhanh so với source

| Nhóm | Tài liệu | Source baseline |
| --- | --- | --- |
| Logistics, marketplace, claim, phân công, đội xe, tài khoản tài xế, chat, GPS đọc Shipper/Carrier, timeline | CODE EXISTS | Có route trong `server/src/app.ts`. Có test API theo báo cáo 71/71 tại commit trước. Browser E2E và tile Mapbox chưa có biên bản |
| Gói, quyền lợi, hạn mức, hoa hồng, giá dầu thế giới, báo cáo sự cố, admin quản lý gói | NOT IMPLEMENTED | Không có router tương ứng. `packageCount` là số kiện hàng. Enum `INCIDENT` trên shipment không phải workflow sự cố. Role ADMIN đăng nhập được, workspace vận hành chưa mở |
| Thanh toán online, VAT, hóa đơn, ví | AFTER MVP | Không triển khai trong các task dưới đây |

## Bảng quyết định còn cần Product Owner

| Decision ID | Nội dung | Trạng thái | Ảnh hưởng | Việc cần Product Owner duyệt |
| --- | --- | --- | --- | --- |
| COM-01 | Thu hoa hồng cả Shipper và Carrier | APPROVED DIRECTION | Mô hình hai khoản phí độc lập | Không cần chọn lại hướng A. Chi tiết vẫn ở các ID dưới |
| COM-02 | Cơ sở tính là `listedPriceVnd`, không cộng phí vào nhau | PROPOSED | Công thức phí | Chọn cơ sở tính trước khi code |
| COM-03 | Snapshot Shipper lúc PUBLISHED, Carrier lúc CLAIM | PROPOSED | Thời điểm khóa tỷ lệ | Chọn một mốc duy nhất |
| COM-04 | Làm tròn VND và VAT | OPEN | Số tiền ghi nhận | Chốt rounding. VAT sau MVP |
| COM-05 | Phí thành ACCRUED tại DELIVERY_CONFIRMED, không PAID | PROPOSED | Trạng thái ghi nhận | Duyệt hoặc đổi trạng thái |
| COM-06 | Hủy chuyến, hoàn, điều chỉnh phí | OPEN | Audit và quyền điều chỉnh | Chốt VOID, HOLD, ADJUSTMENT |
| COM-07 | Thu tiền khi chưa có thanh toán online | OPEN | Pilot có thu ngoài hệ thống hay chỉ báo giá | Chốt trước khi hiện số tiền như nghĩa vụ thật |
| PKG-01 | Giá và tên gói trong ảnh | OPEN | Catalog công khai | Ký hoặc giữ nhãn đề xuất |
| PKG-02 | Gói gắn User hay Organization | OPEN | Schema chủ thể gói | Chọn mô hình. Organization chưa có trong code |
| PKG-03 | Trần số xe Carrier | OPEN | Hạn mức đội xe | Chốt cap hoặc hoãn enforcement |
| PKG-04 | Hạn mức số đơn Shipper | OPEN | Có bịa quota nếu tự đặt | Quyết định có quota hay không. Không đặt ngầm |
| PKG-05 | Quyền lợi Premium | OPEN | Khóa tính năng | Chỉ khóa phần đã có code và đã duyệt |
| PKG-06 | Ai cấp gói trả phí | OPEN | Admin approval | Chốt vai và bằng chứng ngoài hệ thống |
| PKG-07 | Hết hạn, nâng, hạ, grace | OPEN | Chuyến đang chạy | Chốt không làm gãy chuyến đã nhận |
| PKG-08 | Enterprise theo hợp đồng | OPEN | Giá và tỷ lệ từng hợp đồng | Không lấy điểm giữa của dải |
| PKG-09 | Nhiều chi nhánh, đổi vai | OPEN | Ngoài MVP nhỏ | Xác nhận không nằm trong MVP này |
| OIL-01 | Chỉ giá dầu thô thế giới | APPROVED | Phạm vi module | Không mở rộng thành đổ dầu hay tiêu hao |
| OIL-02 | Nguồn Brent/WTI | OPEN | Feed | Chốt nhà cung cấp, đơn vị, tần suất |
| OIL-03 | Trang hiển thị giá | OPEN | Frontend | Chốt vị trí UI |
| OIL-04 | Dữ liệu cũ và lỗi nguồn | OPEN | Trạng thái hiển thị | Chốt ngưỡng stale |
| INC-01 | Ai báo, xem, xử lý, đóng | OPEN | RBAC | Chốt actor trước khi làm form |
| INC-02 | Trạng thái sự cố, không đổi shipment | OPEN | Tách entity | Chốt state machine sự cố |
| INC-03 | Loại sự cố và file đính kèm | OPEN | Form | Chốt tập trường tối thiểu |
| INC-04 | SLA và thông báo | OPEN | Vận hành | Không hứa 24/7 nếu chưa có |
| QA-01 | Database QA tách biệt | OPEN | Môi trường test | Cho phép DB disposable, cấm DB `coldi` |
| QA-02 | Mapbox và GPS trên browser | OPEN | UAT bản đồ | Cung cấp token `pk.` và cách giả lập vị trí |
| DOC-01 | Công bố bộ docs v2.6 | PENDING | PR này | Review và duyệt tài liệu. Chưa merge |

## FE-05B — Logistics E2E

- **Task ID:** FE-05B
- **Mục tiêu:** Chạy và ghi biên bản luồng vận tải đã có mã, từ đăng đơn đến xác nhận giao, trên database QA riêng.
- **Business requirements:** [01_MVP_SCOPE_v2.6.md](../product/01_MVP_SCOPE_v2.6.md) mục LOG, FLEET, TRACK, QA. Ca kiểm thử [02_ACCEPTANCE_PLAN_v2.6.md](02_ACCEPTANCE_PLAN_v2.6.md) mục A, LOG-E2E-01 đến LOG-E2E-08.
- **Điều kiện tiên quyết:** QA-01 và QA-02 được cho phép. Không cần chốt giá gói để chạy logistics hiện có.
- **Backend:** Không thêm nghiệp vụ. Giữ lifecycle `PUBLISHED → MATCHED → IN_TRANSIT → DELIVERY_CONFIRMED`. Nếu test phát hiện lỗi, sửa trong task riêng có bằng chứng, không nhân tiện thêm gói hay sự cố.
- **Frontend:** Thao tác UI thật. Chat phải lưu được. Claim không đổi giá. GPS không đổi trạng thái đơn. Xác nhận giao không tạo thanh toán.
- **Database/schema:** Không đổi schema cho task này. Dữ liệu thử chỉ trên DB disposable.
- **RBAC:** Shipper chỉ đơn của mình. Carrier chỉ chuyến đã nhận. Driver chỉ chuyến được gán và chỉ gửi GPS khi `IN_TRANSIT`.
- **Test cases:** Publish, chat persisted, claim đồng thời một người thắng, phân công, pickup, GPS, delivery, timeline, từ chối đọc chéo doanh nghiệp.
- **Acceptance criteria:** Biên bản browser ghi SHA, shipment id, kết quả từng ca. Mapbox chỉ PASS khi tile và marker thật hiện với token `pk.`. 71 test backend cũ không thay biên bản này.
- **BLOCKED:** QA-01, QA-02 cho môi trường. Phần logistics code không bị chặn bởi COM/PKG.
- **Không được mở rộng:** Không bắt đầu Package, Commission, Oil, Incident. Không đánh dấu MVP hoàn thành. Nghiệm thu bố cục của Carrier Home, phần phân công chuyến, Driver Home và khung chat không phải FUNCTIONAL UAT. E2E, chat lưu thật và Mapbox vẫn chưa có biên bản.

## PKG-CAT — Package Catalog và Entitlements

- **Task ID:** PKG-CAT
- **Mục tiêu:** Có danh mục gói và quyền lợi để Shipper, Carrier xem đúng vai, sau khi bảng được duyệt.
- **Business requirements:** [02_PRICING_PACKAGES_v2.6.md](../product/02_PRICING_PACKAGES_v2.6.md), [04_PACKAGE_WORKFLOWS_v2.6.md](../product/04_PACKAGE_WORKFLOWS_v2.6.md) mục xem danh mục.
- **Điều kiện tiên quyết:** PKG-01 đã được duyệt trong v2.7 làm baseline thương mại dự kiến. UI vẫn phải nói chưa mở bán online và chưa thu tiền. Câu gốc của dòng này nói nếu chưa duyệt thì chỉ được ghi nhãn đề xuất.
- **Backend:** API đọc catalog theo vai. Không nhận giá từ client. Không tạo thanh toán.
- **Frontend:** Tab Shipper và Carrier. Enterprise hiển thị báo giá khi rate là dải. Không vẽ nút cho quyền lợi chưa có code.
- **Database/schema có thể cần:** Plan và PlanVersion. Schema chưa được duyệt. Không dùng `packageCount` của shipment.
- **RBAC:** Guest xem phần công khai nếu được duyệt. User chỉ xem gói đúng vai của mình.
- **Test cases:** PKG-02, PKG-09, PKG-10 trong acceptance plan.
- **Acceptance criteria:** Số gói và quyền lợi khớp bản đã ký. API lỗi không dựng gói giả.
- **BLOCKED:** PKG-01, PKG-05, PKG-08, PKG-09.
- **Không được mở rộng:** Không tự chọn giá trong ảnh làm giá chính thức. Không khóa GPS, chat, claim của luồng đã có chỉ vì gói Free. Không làm cổng thanh toán.

## PKG-LIFE — Package Lifecycle và Limits

- **Task ID:** PKG-LIFE
- **Mục tiêu:** Gán gói hiện tại, kiểm tra hạn mức phía server, xử lý nâng, hạ, hết hạn theo rule đã duyệt.
- **Business requirements:** [04_PACKAGE_WORKFLOWS_v2.6.md](../product/04_PACKAGE_WORKFLOWS_v2.6.md).
- **Điều kiện tiên quyết:** PKG-02, PKG-03, PKG-04, PKG-06, PKG-07. PKG-CAT có catalog đã duyệt.
- **Backend:** Một assignment hiệu lực cho mỗi chủ thể. Từ chối vượt cap. Không xóa xe và không dừng chuyến `IN_TRANSIT` khi hạ gói, trừ khi rule đã duyệt nói khác.
- **Frontend:** Màn gói hiện tại, quyền lợi, hạn mức còn lại, gửi yêu cầu chuyển gói. Trạng thái PENDING không được hiện như đã kích hoạt.
- **Database/schema có thể cần:** PlanAssignment, PlanRequest, audit. Chủ thể là User cho tới khi PKG-02 chọn Organization.
- **RBAC:** User không tự cấp gói trả phí. Driver không mua gói. Driver vẫn hoàn thành chuyến đã gán khi gói Carrier hết hạn, theo đề xuất đang chờ duyệt.
- **Test cases:** PKG-01, PKG-03 đến PKG-08 trong acceptance plan, gồm request đồng thời và ngày hết hạn.
- **Acceptance criteria:** Hạn mức bị chặn ở server. Retry không tạo hai gói Free. Hết hạn không làm gãy chuyến đang chạy theo rule đã ký.
- **BLOCKED:** PKG-02, PKG-03, PKG-04, PKG-06, PKG-07.
- **Không được mở rộng:** Không bịa quota đơn của Shipper. Không tự chạy migration lên database `coldi`. Không thêm Organization hay role switcher.

## COM-RULES — Two-sided Commission Rules

- **Task ID:** COM-RULES
- **Mục tiêu:** Ghi nhận hai khoản hoa hồng độc lập khi, và chỉ khi, công thức đã được duyệt. MVP dừng ở ước tính hoặc ghi nhận, không thu tiền.
- **Business requirements:** [03_COMMISSION_POLICY_v2.6.md](../product/03_COMMISSION_POLICY_v2.6.md). Hướng A là APPROVED DIRECTION. Phần còn lại là PROPOSED hoặc OPEN.
- **Điều kiện tiên quyết:** COM-02, COM-03, COM-04, COM-05, COM-06, COM-07 và PKG-01. Gói phải có tỷ lệ đã ký, không dùng dải Enterprise như một số duy nhất.
- **Backend:** Tính trên server từ `listedPriceVnd` và tỷ lệ đã snapshot. Idempotent theo shipment và phía trả. Không lấy tỷ lệ từ client. `DELIVERY_CONFIRMED` không thành `PAID`.
- **Frontend:** Preview phí của chính user trước publish hoặc claim. Không hiện doanh thu nền tảng cho phía kia.
- **Database/schema có thể cần:** snapshot tỷ lệ và bản ghi accrual tách khỏi event logistics. Schema trong tài liệu chỉ là gợi ý.
- **RBAC:** Shipper thấy phí Shipper. Carrier thấy phí Carrier. Admin chỉ khi có quyền đối soát được duyệt.
- **Test cases:** COM-01 đến COM-08 trong acceptance plan. Ví dụ 10.000.000 VND chỉ là minh họa, không phải hóa đơn.
- **Acceptance criteria:** Hai phí tính trên cùng cước gốc, không cộng dồn. Retry claim hoặc delivery không nhân đôi bản ghi. Thiếu rate hợp đồng thì NEEDS_QUOTE thay vì lấy điểm giữa.
- **BLOCKED:** COM-02, COM-03, COM-04, COM-05, COM-06, COM-07, PKG-01, PKG-08.
- **Không được mở rộng:** Không cổng thanh toán, không VAT, không ví, không sửa `listedPriceVnd` thành tổng đã cộng phí. Không thêm trạng thái `COMPLETED` hay `PAID` vào shipment.

## OIL-FEED — World Oil Price Feed

- **Task ID:** OIL-FEED
- **Mục tiêu:** Hiển thị giá dầu thô thế giới có nguồn, đơn vị USD/thùng, ngày quan sát, thời điểm lấy về và trạng thái dữ liệu.
- **Business requirements:** [05_WORLD_OIL_PRICE_v2.6.md](../product/05_WORLD_OIL_PRICE_v2.6.md). OIL-01 APPROVED. OIL-02 đến OIL-04 còn OPEN.
- **Điều kiện tiên quyết:** OIL-02, OIL-03, OIL-04. Kiểm tra điều khoản hiển thị của nhà cung cấp.
- **Backend:** Job server gọi nhà cung cấp. Cache. Từ chối giá không hợp lệ. Lỗi feed không làm fail đăng nhập, đăng đơn, claim, lấy hàng hay giao hàng. Secret chỉ ở server.
- **Frontend:** Khối thông tin theo vị trí đã duyệt. Nhãn không phải giá bán lẻ Việt Nam và không phải cước. Thiếu dữ liệu thì báo chưa tải được, không hiện 0.
- **Database/schema có thể cần:** bản ghi benchmark, period, value, unit, source, fetchedAt, validationStatus. Không gắn với xe hay chuyến.
- **RBAC:** Đọc công khai nếu OIL-03 chọn vậy. Không ai sửa giá trên UI.
- **Test cases:** OIL-01 đến OIL-06 trong acceptance plan.
- **Acceptance criteria:** Brent và WTI, hoặc benchmark đã duyệt, kèm ngày nguồn khác thời điểm COLDI lấy về. Dữ liệu cũ có nhãn. Không có form nhập lít.
- **BLOCKED:** OIL-02, OIL-03, OIL-04.
- **Không được mở rộng:** Không đổ dầu theo xe, không lít, không định mức, không chi phí nhiên liệu chuyến, không giá xăng Việt Nam, không đổi `listedPriceVnd` theo giá dầu, không hardcode series chưa kiểm chứng.

## INC-RPT — Incident Reporting

- **Task ID:** INC-RPT
- **Mục tiêu:** Tạo và xử lý báo cáo sự cố vận chuyển bằng entity riêng, có lịch sử, không làm sai trạng thái chuyến.
- **Business requirements:** [06_INCIDENT_REPORTING_v2.6.md](../product/06_INCIDENT_REPORTING_v2.6.md). Phạm vi module là MVP REQUIRED. Luồng chi tiết là DRAFT.
- **Điều kiện tiên quyết:** INC-01, INC-02. INC-03 và INC-04 trước khi làm file đính kèm hoặc SLA.
- **Backend:** CRUD có kiểm tra quyền theo shipment. Mọi chuyển trạng thái ghi actor, thời điểm, trước và sau. Mở sự cố không ghi `shipment.status = INCIDENT`.
- **Frontend:** Form và danh sách theo vai đã duyệt. Tài xế chỉ thao tác khi đã dừng xe an toàn, theo copy đề xuất. Không có nút đổi trạng thái vận chuyển trong màn sự cố.
- **Database/schema có thể cần:** Incident và IncidentEvent. Không sửa latestLocation hay giá.
- **RBAC:** Theo INC-01 sau khi duyệt. Đề xuất hiện tại, chưa phải rule: Driver báo trên chuyến được gán, Carrier xử lý chuyến mình nhận, Shipper xem đơn mình, Admin chỉ case được giao.
- **Test cases:** INC-01 đến INC-07 trong acceptance plan.
- **Acceptance criteria:** Người không có quyền bị từ chối. Retry không tạo hai bản giống hệt. `IN_TRANSIT` giữ nguyên khi sự cố đang mở. Đóng sự cố không tạo `PAID`.
- **BLOCKED:** INC-01, INC-02, INC-03, INC-04.
- **Không được mở rộng:** Không dùng enum shipment `INCIDENT` làm workflow. Không phạt tiền, không bảo hiểm, không hủy chuyến tự động, không thông báo khẩn 24/7.

## ADM-PKG — Admin Package Management

- **Task ID:** ADM-PKG
- **Mục tiêu:** Admin có quyền phù hợp xem yêu cầu gói và ghi nhận cấp, từ chối, hết hạn kèm lý do.
- **Business requirements:** [04_PACKAGE_WORKFLOWS_v2.6.md](../product/04_PACKAGE_WORKFLOWS_v2.6.md) mục yêu cầu gói trả phí. Trang `/admin` hiện báo khu vận hành chưa mở.
- **Điều kiện tiên quyết:** PKG-06, PKG-07, PKG-LIFE. Có permission riêng, không suy từ việc role ADMIN đăng nhập được.
- **Backend:** Approve và reject idempotent. Lưu actor, lý do, thời hiệu lực. Không đánh dấu đã thanh toán chỉ vì bấm duyệt.
- **Frontend:** Hàng chờ yêu cầu trong workspace admin. Không mở GPS hay chat toàn hệ thống trên cùng màn.
- **Database/schema có thể cần:** trạng thái PlanRequest và audit. Dùng chung schema với PKG-LIFE sau khi được duyệt.
- **RBAC:** Chỉ permission quản lý gói. Admin không mặc định đọc GPS, chat hay dữ liệu doanh nghiệp khác.
- **Test cases:** Approve hai lần chỉ một assignment active. User thường không gọi được API duyệt. Từ chối không đổi gói cũ.
- **Acceptance criteria:** PENDING không kích hoạt quyền. Có audit. Workspace admin còn lại vẫn đóng nếu chưa có task riêng.
- **BLOCKED:** PKG-06, PKG-01, PKG-07.
- **Không được mở rộng:** Không xây cả admin console. Không đối soát tiền. Không tự xem là đã thu phí.

## MVP-ACC — Full MVP Regression và Acceptance

- **Task ID:** MVP-ACC
- **Mục tiêu:** Gom bằng chứng logistics và các module mới đã được duyệt, rồi đưa Product Owner nghiệm thu.
- **Business requirements:** Điều kiện FULL MVP COMPLETE trong [01_MVP_SCOPE_v2.6.md](../product/01_MVP_SCOPE_v2.6.md) mục 6 và [01_STATUS_v2.6.md](01_STATUS_v2.6.md).
- **Điều kiện tiên quyết:** FE-05B có biên bản. Các task PKG, COM, OIL, INC, ADM chỉ vào vòng này sau khi decision P0 của chúng không còn OPEN và code đã có test.
- **Backend:** Chạy lại test API trên DB tách biệt, ghi SHA. Không dùng 71 test của commit cũ làm bằng chứng module mới.
- **Frontend:** Browser pass có thao tác thật. Mapbox pass chỉ khi tile và marker thật.
- **Database/schema:** Không ghi database phát triển tên `coldi`.
- **RBAC:** Ma trận âm tính cho shipment, gói, phí, sự cố và admin.
- **Test cases:** Toàn bộ acceptance plan sau khi rule đã ký. Ca nào còn OPEN thì ghi BLOCKED, không gắn PASS.
- **Acceptance criteria:** Không còn P0 hoặc P1 của phạm vi đã duyệt. UI được Product Owner chấp nhận theo từng màn. Docs và code cùng SHA. Nếu rule đổi sau bản v2.6 đã phát hành, tài liệu kế tiếp là v2.7.
- **BLOCKED:** Mọi ID OPEN ở bảng trên, cộng QA-01 và QA-02.
- **Không được mở rộng:** Không tuyên bố MVP hoàn thành từ riêng backlog này. Không gộp thanh toán online vào tiêu chí đóng MVP.

## Thứ tự gợi ý khi Product Owner mở khóa

1. FE-05B có thể chạy trên code hiện có ngay khi có DB QA và token bản đồ.
2. PKG-CAT và PKG-LIFE chỉ sau khi bảng giá, chủ thể gói và hạn mức được ký.
3. ADM-PKG đi cùng lifecycle, không trước PKG-06.
4. COM-RULES sau khi có tỷ lệ đã ký và mốc snapshot.
5. OIL-FEED sau khi có nguồn và vị trí hiển thị. Không phụ thuộc gói.
6. INC-RPT sau khi có actor và trạng thái sự cố.
7. MVP-ACC là vòng cuối, không thay cho từng task ở trên.
