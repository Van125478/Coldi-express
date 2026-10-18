# COLDI v2.4 — Product Decisions & Scope Addendum

> **18/10/2026:** Chính sách thương mại hiện hành là [v2.7](../v2.7/README.md). Bảng quyết định bên dưới là biên bản ngày 17/10/2026 và được giữ nguyên. PD-16 nói subscription nằm sau FE-05A. v2.7 đã duyệt chính sách gói và hoa hồng ở mức tài liệu; các module đó vẫn chưa có trong code.

> **Ngày tổng hợp:** 17/10/2026  
> **Repository:** `Van125478/Coldi-express`  
> **Nhánh bắt buộc khi đối chiếu:** `integration/coldi-v2.3-mvp` (không mặc định dùng `main`).  
> **Tính chất:** Biên bản thống nhất yêu cầu sản phẩm/UI với chủ dự án trong phiên review FE-05A. Đây là **tài liệu bổ sung** cho COLDI v2.4, **không phải xác nhận code đã triển khai**. Những mục "để sau" không cấp quyền tự động sửa backend, database, phân quyền hoặc UI.  
> **Mốc source từ xa cuối đã đọc trong phiên:** `76a12713a7a6a68cfd8998337b86f4588adc1956`. Cursor báo có sửa đổi FE-05A **chưa commit/push** sau mốc này; nội dung working tree của Cursor chưa được đọc trực tiếp qua GitHub.

## 1. Quy ước trạng thái và thẩm quyền

- **CHỐT — PRODUCT:** Chủ dự án đã quyết định hành vi/định hướng. Không mặc định là nằm trong MVP đang thi công.
- **HIỆN CÓ — CODE/REPORT:** Đã thấy trong code ở nhánh nêu trên hoặc do Cursor báo cáo. Phải ghi rõ loại bằng chứng và phiên bản.
- **PENDING — DESIGN/DEPENDENCY:** Cần quyết định, dữ liệu thật, token, kiểm thử hoặc nghiệm thu.
- **LÀM SAU:** Định hướng chốt nhưng **không triển khai trong FE-05A**; chỉ triển khai khi có đặc tả/phạm vi được duyệt riêng.
- **VISUAL ACCEPTED:** Chỉ được đánh dấu khi **chủ dự án xác nhận** trên screenshot/browser đúng phiên bản. Unit test, lint, build và browser visit không thay thế nghiệm thu.

## 2. Bảng quyết định sản phẩm — toàn bộ nội dung chốt

| ID | Vấn đề | Quyết định đã chốt | Triển khai / lưu ý |
| --- | --- | --- | --- |
| PD-01 | Mục tiêu giao diện | Ưu tiên desktop 1280–1440px; mobile tối ưu sau | FE-05A tập trung desktop. Không phá responsive đang chạy |
| PD-02 | Nguồn thiết kế | Dùng đúng ảnh tham chiếu tại `Asset/coldi/`; không thay thế bằng template chung | So side-by-side; giữ nguyên tính năng MVP, bỏ phần prototype chưa có nghiệp vụ |
| PD-03 | Layout | Một `WorkspaceLayout` dùng chung nhưng logo, header/sidebar/home phù hợp SHIPPER, CARRIER, DRIVER | Carrier sidebar navy; Shipper/Driver sáng; không thêm role switcher |
| PD-04 | Guest | Giữ nguyên Guest Homepage cinematic, không bỏ các section đã đầu tư | Auth nên kế thừa nhận diện, không phải nhúng animation nặng vào form |
| PD-05 | Guest → Auth | Hành trình Guest → Login → workspace đúng role phải liền mạch về thương hiệu | Polish UI có thể làm; logic auth/redirect không đổi tùy tiện |
| PD-06 | Marketplace duy nhất | Sản phẩm cuối chỉ có một sàn thật `/carrier/tim-chuyen`, lưới thẻ PUBLISHED dùng dữ liệu API | Không có một "sàn preview" riêng hiển thị cho người dùng |
| PD-07 | Marketplace trạng thái trống | 0 PUBLISHED → empty state trung thực; API lỗi → error state riêng | Tuyệt đối không tạo đơn, số liệu, rating, ảnh hoặc giá giả |
| PD-08 | Preview thẻ | Fixture chỉ dùng để kiểm thử bố cục trong môi trường dev, cách ly khỏi DB và bản production | Dọn mode/query preview khỏi trải nghiệm cuối khi đã hoàn thành kiểm chứng |
| PD-09 | Xem đơn | Card thật → `/carrier/chuyen/:id` đúng đơn. Card preview không được dẫn về hash/route gây nhầm lẫn | Preview cần CTA disabled/ghi rõ chỉ mô phỏng, hoặc bỏ khi thu dọn preview |
| PD-10 | Carrier Detail | Tuyến, trạng thái vận hành, giá, hàng hóa và phân công nổi bật; hạn chế trùng lặp, không lộ `MATCHED` | Giữ nghiệp vụ Claim/Assign/Chat/Timeline và dữ liệu thật |
| PD-11 | Bản đồ | Phân biệt (A) map tuyến lấy → giao với (B) map GPS vị trí xe | Không tự geocode, thêm tọa độ, vẽ route, tính ETA; xem mục 7 |
| PD-12 | Logo/sidebar | Logo không bị cắt và sidebar phải sử dụng được khi cuộn desktop | Kiểm tra Shipper/Carrier/Driver ở 1280, 1440 và deep link |
| PD-13 | Shipper/Driver | Polish theo đúng ảnh gốc; ưu tiên thông tin vận hành rõ ràng; tránh text kỹ thuật | Giữ quyền và thao tác; không tự thêm nghiệp vụ prototype |
| PD-14 | FE-05A/05B | FE-05A đang review, chưa có màn visual accepted; FE-05B chưa bắt đầu | Có thể review Carrier đồng thời Cursor chỉnh Shipper/Driver/Login, nhưng phải đối chiếu lại shared components |
| PD-15 | Git / dữ liệu | Không tự sửa code, reset/stash, commit/push khi chưa được yêu cầu; giữ local work | Không mutation nghiệp vụ trong phiên review read-only |
| PD-16 | Phase 2 | Subscription, mua gói, thanh toán, công nợ, VAT/finance prototype không thuộc scope UI MVP hiện tại | Không tự triển khai |

## 3. Account, Registration, Provisioning và Business Verification — LÀM SAU

### 3.1. Quyết định phương án B

**CHỐT — PRODUCT:** Hai nhóm khách hàng bên ngoài được tự đăng ký trên website và **sử dụng ngay sau khi tạo tài khoản hợp lệ**, **không cần Admin phê duyệt thủ công**:

- `SHIPPER`: Chủ hàng / chủ doanh nghiệp (doanh nghiệp có hàng cần vận chuyển).
- `CARRIER`: Chủ xe / nhà xe (đơn vị vận tải).

Các tài khoản nhân sự **không tự đăng ký công khai**:

- `DRIVER`: do CARRIER quản lý, tạo và cấp tài khoản.
- `WAREHOUSE` (nhân sự kho): do SHIPPER quản lý, tạo và cấp tài khoản; **đây là yêu cầu tương lai**. Chưa xác định đủ permission, màn hình và workflow; **không tự thêm role này vào RBAC MVP**.
- `ADMIN`: do COLDI cấp nội bộ; không có đăng ký công khai.

Luồng dự kiến: Guest → chọn SHIPPER/CARRIER → form đăng ký phù hợp → tạo tài khoản hợp lệ → dùng workspace đúng vai trò. Không có bước hàng đợi Admin duyệt để được hoạt động. Các chi tiết xác minh email, kiểm tra trùng, rate limit, chống lạm dụng, tổ chức/tenant, bảo vệ tài khoản và dữ liệu cần đặc tả riêng trước khi build — không ngầm suy diễn rằng đã có sẵn.

### 3.2. Xác thực doanh nghiệp không phải kích hoạt tài khoản

**CHỐT — PRODUCT (triển khai sau):** COLDI quản lý một **dấu xác thực doanh nghiệp** riêng với khả năng đăng nhập/hoạt động của tài khoản:

- Mặc định sau tự đăng ký: doanh nghiệp **chưa xác thực**; tài khoản hợp lệ vẫn dùng được các chức năng SHIPPER/CARRIER theo quyền thông thường (đăng đơn/nhận chuyến).
- **Admin COLDI** có quyền cấp dấu **Đã xác thực** thủ công sau khi kiểm tra doanh nghiệp.
- Admin có thể **thu hồi dấu xác thực**; việc thu hồi **không tự động khóa tài khoản hoặc cắt quyền nghiệp vụ** nếu tài khoản vẫn đang active.
- Doanh nghiệp không tự cấp dấu cho mình. Dấu doanh nghiệp không mặc định là dấu xác thực cá nhân của DRIVER/WAREHOUSE.
- Không giả lập badge ở Marketplace hoặc hồ sơ khi backend chưa có trạng thái tin cậy.

**PENDING — SPEC:** Tên enum, dữ liệu chứng minh, nơi hiển thị dấu, nhật ký/lý do duyệt/thu hồi, cơ chế khi phát hiện gian lận, phân tách trạng thái khóa tài khoản và xác thực doanh nghiệp. Cần duyệt trước khi triển khai.

### 3.3. Đối chiếu với code hiện tại

- Code MVP đang sử dụng 4 role `SHIPPER`, `CARRIER`, `DRIVER`, `ADMIN`; Guest không phải role.
- Carrier đã có luồng quản lý/cấp tài khoản DRIVER cơ bản; quyền cụ thể tiếp tục theo backend hiện có.
- `/dang-ky` đang là UI không tạo tài khoản; không tuyên bố đã có self-registration.
- Header Guest hiện không quảng cáo đăng ký vì đăng ký chưa hoạt động. Khi triển khai signup thật, phải cập nhật lại CTA/header theo luồng được duyệt.
- **Không triển khai registration, verification badge, WAREHOUSE hay thay đổi RBAC trong FE-05A.**

## 4. Guest, Login và Register — thiết kế xuyên suốt

- `/` là cinematic landing và phải giữ nguyên trải nghiệm chính.
- `/dang-nhap` hoạt động với tài khoản đã cấp; sau khi đăng nhập dẫn đúng `/shipper`, `/carrier`, `/driver` hoặc `/admin` theo quyền, giữ yêu cầu đổi mật khẩu ban đầu của Driver.
- Login nên sử dụng màu, hình ảnh, typography, logo và motif đã có từ Guest; form đăng nhập là trọng tâm, không tải animation nặng không cần thiết. **Mọi thay đổi UI đều chờ visual acceptance**.
- `/dang-ky` hiện chưa tạo tài khoản thật; không hiển thị trải nghiệm khiến khách tưởng đăng ký thành công. Về sau khi PD tự đăng ký được triển khai mới bật CTA Đăng ký công khai.
- `GuestLayout`, `AuthLayout`, `WorkspaceLayout` tiếp tục là ba lớp layout phù hợp mục đích; không gộp chỉ để thống nhất màu.

## 5. Carrier Marketplace & Carrier Home

### Marketplace cuối cùng (đã chốt)

- Một trang `/carrier/tim-chuyen`, một bộ lọc/tìm kiếm và một card component phục vụ **đơn PUBLISHED thực tế**.
- Trên desktop 1440 và 1280 ưu tiên lưới 3 cột nếu đủ chiều rộng, card không tràn, nút/giá thẳng hàng, route dài xuống dòng an toàn; responsive khác được kiểm riêng.
- Cấu trúc card tham chiếu `Asset/coldi/homepagecarthinh.png`: media region lớn (ảnh thật nếu có, nếu không fallback trung thực), ID/status, loại hàng, tuyến nổi bật, yêu cầu xe, lịch lấy, giá, CTA `Xem đơn`.
- Bộ lọc chính dễ thao tác và ưu tiên phần danh sách trên viewport; **đề xuất polish** giảm chiều cao bằng bộ lọc nâng cao thu gọn. Giữ tính năng lọc Core 13 thực tế.
- Tuyệt đối không tạo ảnh hàng, đơn, giá, source-count `1.248`, xác minh công ty, rating, ETA, khoảng cách, bookmark giả.
- API lỗi không được viết là `0 đơn`; phải có trạng thái lỗi và nút thử lại (nếu đã hỗ trợ).
- Không dùng fixture để chứng minh nghiệp vụ `Xem đơn` của card thật. Cần một bài test riêng bằng đơn PUBLISHED thật trong **môi trường kiểm thử được cho phép mutation** ở giai đoạn sau.
- `/carrier` vẫn là Carrier Home riêng (tổng quan, điều hướng, chuyến theo dõi). **Điểm review P2**: lối tắt trùng sidebar có thể được tinh gọn, chưa quyết định bỏ các lối tắt.

### Preview hiện tại

- Cursor báo preview được bật ở DEV bằng query `?xem-truoc-bo-cuc=1`; có 3 fixture không ghi DB, production build không chứa fixture.
- Lỗi UX đã thấy: CTA `Xem đơn` trên fixture đi tới `#bo-cuc-khong-phai-don`, bỏ query preview và trở về trang trống; **không được xem đó là luồng đơn thật đã hoạt động**.
- Quyết định: preview là công cụ tạm, không phải page chính hoặc tính năng phát hành. Sau khi kiểm thử thẻ đủ, loại bỏ entry point và hash giả khỏi UI người dùng; chỉ để fixture riêng cho test/Storybook/dev tooling nếu còn cần.

## 6. Carrier Shipment Detail — quy tắc nội dung

- Reference: `Asset/coldi/chuyến hàng.png` và các ảnh Carrier Detail tương ứng.
- Giữ hai cột desktop có mức ưu tiên: **tuyến + status**, **giá + hành động**, **cụm hàng hóa**, **phân công**, **liên hệ/chat**, **timeline**.
- Không để `Trạng thái lưu: MATCHED` hoặc ghi chú cấu trúc dữ liệu vào phần UI chính; dùng nhãn vận hành tiếng Việt.
- Tránh lặp route, thời gian, loại hàng và yêu cầu xe nhiều lần. Thiếu dữ liệu thì hiển thị trung thực, nhưng dùng ngôn ngữ gọn; không tự thay bằng giá trị ước tính.
- Timeline chỉ hiện những sự kiện có dữ liệu; lịch sử legacy/thiếu mốc được diễn đạt ngắn, không tự tạo thời điểm Claim/Assign.
- Carrier không tự dùng API GPS chỉ dành cho Shipper; map tuyến cần dữ liệu địa lý thực và quyết định sản phẩm riêng.
- Những lỗi nhỏ còn cần xem trên ảnh: `Tài xế Tài xế demo`, quá nhiều `Chưa có`, map fallback chưa thật tự nhiên. **Đây là các phát hiện review, không phải danh sách đã accepted.**

## 7. Hai bản đồ khác nhau — giới hạn đã thống nhất

| Loại | Mục đích | Hiện trạng | Quyết định |
| --- | --- | --- | --- |
| **A. Pickup/Delivery route map** | Vẽ hai điểm kho và đường giữa chúng | Shipment có địa chỉ văn bản, chưa có tọa độ kho hoặc workflow geocode đã duyệt | Chưa triển khai. Cần chốt lưu tọa độ hoặc geocoding provider, quyền/chi phí/dữ liệu thật. Không tự vẽ route, khoảng cách, ETA |
| **B. Live vehicle GPS map** | Theo dõi vị trí tài xế cung cấp cho đơn | Code Shipper có Mapbox, nhưng tile/marker chưa được kiểm chứng thực địa và thiếu token local trong đợt review | Không dùng sai quyền để cấp GPS cho Carrier. Không đồng nhất GPS với map tuyến |

- Cơ chế GPS hiện có: driver được gán gửi khi `IN_TRANSIT`, shipper của đơn đọc vị trí theo phân quyền; GPS không tự xác nhận nhận/giao, không tạo mốc timeline, không phải thanh toán.
- Mapbox chỉ được mở khi có vị trí hợp lệ, public `pk.` token và môi trường WebGL phù hợp. Không thêm tọa độ giả, GPS nền, geofence hoặc Dynamic ETA.
- Trạng thái sau giao nếu có vị trí cuối là **vị trí lịch sử**, không được gọi live.
- FE-05A chỉ đánh giá fallback và CTA; nghiệm thu map tiles thật thuộc lượt test được phép cấp token/dữ liệu thực.

## 8. Shipper, Driver & giao diện dùng chung

- **Shipper**: giữ home sáng, primary CTA đăng đơn, card có dữ liệu thật, chỉnh tên liên kết `Xem vị trí cuối` cho đơn đã giao nếu phù hợp trạng thái API. Không thêm tiến độ giả, ETA, xe gần, tài chính hay POD ngoài MVP.
- **Driver**: thiết kế gốc thiên mobile, desktop cần mở rộng khối nội dung có kiểm soát, làm nổi route/xe được gán/việc tiếp theo/nút xem chi tiết; không phá luồng xác nhận lấy/giao.
- **Driver Detail**: giản lược bảng thông tin, giữ CTA xác nhận lấy/giao và GPS đúng trạng thái. Không auto xác nhận theo GPS.
- **Timeline/GPS**: từ ngữ dễ hiểu hơn; giữ dữ liệu và quy tắc phân quyền; hiển thị đúng `Chưa có` nhưng không biến trang thành tài liệu kỹ thuật.
- **Shared**: cùng `WorkspaceLayout`, Header sticky, logo hiển thị đầy đủ ở 1280–1440 và khi cuộn. Logo trong workspace dẫn về chính home của role, logo Guest về `/`.

## 9. Ranh giới MVP, Phase 2 và nguyên tắc không tự mở rộng

- Không đưa subscription, thanh toán, mua gói, hạn mức công nợ, VAT, escrow, đánh giá, bảng xếp hạng, tốc độ, khoảng cách hay ETA của prototype thành feature nếu tài liệu v2.4 chưa duyệt.
- Không tạo dữ liệu thật để phục vụ screenshot UI; preview dev được gắn nhãn rõ và không lưu DB.
- Không chỉnh backend, thêm API/RBAC/role/state/storage hay tự push chỉ vì một screenshot prototype có thành phần đó.
- Nếu product decision mới xung đột đặc tả v2.4 cũ, **lập yêu cầu thay đổi/chờ chủ dự án duyệt cập nhật baseline**; không coi rằng code cũ đã tự đổi.

## 10. Mốc công việc và nghiệm thu

- FE-02 Carrier, FE-03 Shipper, FE-04 Driver: code đã có theo báo cáo và các commit cũ, nhưng **chưa có workspace nào được chủ dự án visual accepted**.
- FE-05A review desktop lần đầu đã push lên `76a1271` theo GitHub đã đọc. Lượt `Critical Feedback`/`User Review Follow-Up` Cursor báo chỉnh nhiều file **trong working tree chưa commit/push**; không được tính là remote source đã cập nhật.
- User có thể tiếp tục review Carrier qua screenshots trong lúc Cursor làm một prompt khác chỉ nhắm Shipper/Driver/Login, miễn không chỉnh Carrier ngoài regression và bảo vệ diff chưa commit.
- FE-05B (rehearsal có thay đổi dữ liệu, Mapbox tiles, mobile): **chưa bắt đầu**. Chỉ thực hiện khi người dùng cho phép workflow ghi dữ liệu và thống nhất môi trường an toàn.
- Tách 4 loại bằng chứng: **Code**, **Automated test**, **Browser behavior**, **User visual acceptance**. Báo cáo Cursor là nguồn báo cáo, không thay cho kiểm chứng của chủ dự án.
- Không `git reset`, `stash`, thay branch, commit/push ngoài yêu cầu. Không xoá local art/lab/assets và file tài liệu ngoài phạm vi.

## 11. Các quyết định và điểm còn mở

| Mã | Cần giải quyết | Trạng thái / thời điểm |
| --- | --- | --- |
| OPEN-01 | Đặc tả registration SHIPPER/CARRIER: bảo mật, email, tenant, form, API và chính sách khóa | LÀM SAU, không FE-05A |
| OPEN-02 | RBAC, UI và quyền dữ liệu của WAREHOUSE; SHIPPER quản lý nhân sự kho | LÀM SAU, chưa được thêm vào 4-role code MVP |
| OPEN-03 | Trường dữ liệu, nơi hiển thị, chứng cứ xác thực và audit khi Admin cấp/thu hồi badge | LÀM SAU |
| OPEN-04 | Dữ liệu GPS địa chỉ lấy/giao, geocoder, nhà cung cấp route, quyền xem map tuyến | PENDING quyết định sản phẩm |
| OPEN-05 | Token Mapbox, API thực, tiles/marker và quyền vị trí khi review E2E | PENDING kiểm chứng |
| OPEN-06 | Carrier Marketplace/Card/Detail: screenshot 1280–1440 sau sửa; UI acceptance | PENDING chủ dự án |
| OPEN-07 | Visual continuity Guest → Login và đăng ký tương lai | PENDING design review |
| OPEN-08 | FE-05B rehearsal nghiệp vụ chỉ trong môi trường dữ liệu được phép | Chưa bắt đầu |

---

**Quy tắc cập nhật:** Khi triển khai bất kỳ quyết định "làm sau" nào, phải có prompt/task riêng, cập nhật tài liệu cơ sở tương ứng và test quyền/nghiệp vụ. Tài liệu này không tự ý thay thế toàn bộ Master Const v2.4 hoặc cho phép sửa GitHub.

## 12. Trạng thái working tree sau lượt Carrier, 17/10/2026

Mục này ghi việc đã làm trong working tree, chưa commit, chưa push, và **chưa visual accepted**. Không biến các mục LÀM SAU thành code.

Đã làm trong giao diện, chưa đổi API nhận chuyến, phân công, chat, GPS hay timeline:

- Sàn thật `/carrier/tim-chuyen` là marketplace duy nhất. Query `xem-truoc-bo-cuc` và thẻ mẫu không còn là một màn hình. Liên kết cũ bị bỏ khỏi URL và không được gửi lên API. Không có route, tab hay trang demo thay thế.
- Thẻ `MarketShipmentCard` vẫn là component dùng cho đơn PUBLISHED thật. `Xem đơn` mở `/carrier/chuyen/:id`. Vùng media là nền thương hiệu, không phải ảnh hàng và không ghi rằng đã có ảnh.
- Bộ lọc chính là ô tìm, nhóm nhiệt và sắp xếp. Điểm lấy, điểm giao, tải trọng và ngày lấy nằm sau “Bộ lọc khác”. Allowlist API không đổi.
- Trang `/carrier` bỏ bốn ô lối tắt trùng sidebar. Tìm kiếm, số đơn đang mở, chuyến đang theo dõi và chuyến đã nhận vẫn còn. Đội xe và tài xế vẫn ở sidebar.
- Chi tiết nhà xe gom số đo còn thiếu thành một câu khi cả ba đều trống. Tên đã chứa chữ “Tài xế” không bị lặp nhãn. Bản đồ tuyến vẫn là một câu: địa chỉ chưa gắn được vị trí.

Chưa làm, và tài liệu này không cho phép làm trong FE-05A:

- Đăng ký SHIPPER/CARRIER, dấu xác thực doanh nghiệp, role WAREHOUSE, form `/dang-ky` nối database.
- Tọa độ điểm lấy/giao, geocoding, tuyến vẽ, khoảng cách, ETA.
- Ảnh hàng thật. Sàn phát triển lúc ghi mục này có 0 đơn PUBLISHED, nên lưới ba thẻ với đơn thật chưa được bấm trên trình duyệt.

Gói nguồn `docs/product/COLDI_Docs_Update_2026-10-17/` được giữ nguyên như bản nhận. File này là bản đã đưa vào `docs/product/`.

## 13. Bổ sung đã duyệt, 18/10/2026

Chủ dự án đã duyệt ba việc. Mục này ghi quyết định và phần đã code. **Chưa visual accepted.** Không mở FE-05B.

### Vị trí xe

SHIPPER vẫn xem vị trí trên đơn do chính tài khoản đó tạo. CARRIER được xem vị trí trên đơn nhà xe đó đã nhận, qua `GET /api/carrier/shipments/:id/location`. Quyền lấy từ phiên đăng nhập và `shipment.carrierId`, không lấy từ tham số do client gửi. Nhà xe chưa nhận đơn, nhà xe khác, chủ hàng khác, tài xế gọi nhầm API đọc của chủ hàng hoặc nhà xe, quản trị và khách đều bị từ chối.

DRIVER vẫn chỉ gửi vị trí khi chuyến đang vận chuyển và đúng tài xế được gán. ADMIN và khách không được thêm quyền xem. Bản đồ tuyến điểm lấy/điểm giao vẫn chưa làm. Một điểm GPS không biến thành tuyến, ETA hay khoảng cách.

Câu ở mục 7, “Không dùng sai quyền để cấp GPS cho Carrier”, được thay bằng quyền đọc này. Carrier không dùng API GPS của Shipper.

### Hộp thoại

Giao diện nhắn tin của chủ hàng và nhà xe chuyển từ form soạn thư sang một khung chat: đầu cuộc trò chuyện, vùng bong bóng, ô nhập và nút gửi cùng hàng. Enter gửi, Shift+Enter xuống dòng. Quyền chat, việc đóng thread, và việc chat không nhận chuyến, không giữ chỗ, không đổi giá hay trạng thái đều giữ nguyên. Không thêm WebSocket, biên nhận đã đọc, tệp đính kèm hay trạng thái online.

### Trang chủ tài xế

Ba số đếm trải theo bề ngang nội dung. Chuyến cần làm nằm bên dưới, chiếm phần chính. Chuyến cần làm khác chỉ hiện khi còn chuyến thật với việc lấy hoặc giao, tối đa ba mục theo thứ tự API đang trả. Một chuyến thì thẻ chính trải ra, không chừa cột trống.

## 14. Cập nhật phạm vi, 18/10/2026

Mục 13 giữ quyết định đã duyệt trong ngày. Mục này ghi phần chủ dự án chốt thêm khi đóng gói FE-05A. Không mở FE-05B và không triển khai gói trong lượt này.

### GPS

- SHIPPER xem vị trí đơn mình tạo, qua `GET /api/shipments/:id/location`.
- CARRIER xem vị trí chuyến mình đã nhận, qua `GET /api/carrier/shipments/:id/location`.
- DRIVER gửi vị trí theo quyền hiện tại: đúng tài xế được gán, chỉ khi `IN_TRANSIT`.
- ADMIN và khách không được cấp quyền GPS mặc định.

### UI

- Bố cục trang chủ tài xế theo nhiệm vụ đã được review và chấp nhận về bố cục.
- Chủ hàng và nhà xe dùng giao diện chatbox mới.
- Chat vẫn không Claim và không đổi giá.
- Các màn FE-05A còn lại chưa được chấp nhận hình ảnh. Chuỗi logistics đầu-cuối chưa được nghiệm thu. Tile Mapbox chưa được kiểm chứng.

### MVP SCOPE — OPTION B, APPROVED

Phương án B thay thế phương án A.

MVP cuối cùng bắt buộc có:

- Logistics workflows.
- Package Management.
- Package entitlements.
- Usage limits and backend enforcement.

Package Management hiện chưa triển khai.

Thanh toán online triển khai sau MVP.

Chưa được tự đặt số lượng gói, tên gói, giá tiền, hạn mức, chu kỳ, cách nâng hoặc hạ gói, hoặc mô hình tổ chức.
