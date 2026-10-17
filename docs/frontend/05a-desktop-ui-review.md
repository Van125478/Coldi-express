# FE-05A — Rà soát giao diện desktop

Ngày ghi: 17/10/2026. Nhánh `integration/coldi-v2.3-mvp`. Xuất phát từ `260477e5426ec0e1ecaa052002ac530e8a971a07`. Người dùng chưa nghiệm thu hình ảnh. FE-05B chưa bắt đầu.

## 1. Nhánh và HEAD

Trước khi sửa, HEAD đúng commit kỳ vọng. Không đổi nhánh, không reset, không stash. Việc local không thuộc FE-05A được giữ nguyên.

## 2. Màn đã mở trên trình duyệt

Chỉ đọc. Có đăng nhập và đăng xuất phiên demo để xem header khách lúc đã đăng nhập và lúc chưa. Không đăng đơn, không nhận chuyến, không phân công, không xác nhận lấy hoặc giao, không gửi chat, không đổi mật khẩu, không khóa hoặc cấp lại mật khẩu tài xế, không sửa xe, không gửi GPS.

| Màn | Cách xem |
| --- | --- |
| `/` đã đăng nhập tài xế | 1440, ảnh. Header dẫn `/driver` |
| `/` đã đăng nhập chủ hàng | 1280, đo DOM. Không tràn ngang. Nút menu `display: none` |
| `/` chưa đăng nhập | 1440, ảnh. Header có Đăng nhập, không có Đăng ký |
| `/driver` | 1440, ảnh. Logo `/driver`. Số 4 chờ lấy, 0 đang chạy, 2 đã giao |
| `/shipper` | 1440, ảnh. 1280 đo DOM, không tràn ngang. Logo `/shipper` |
| `/carrier` | 1440, ảnh. Sidebar navy `rgb(30, 58, 138)`. 1280 không tràn ngang. Logo `/carrier` |
| `/carrier/tim-chuyen` | 1440, ảnh. 1280 không tràn ngang. 0 đơn đang tìm xe |

Cửa sổ đo được là 1425px khi giả lập 1440, và 1265px khi giả lập 1280. `window.innerWidth` đúng 1440 và 1280.

## 3. Ảnh tham chiếu đã mở trong lượt này

- `Asset/coldi/homepagecarthinh.png`: sàn nhà xe dạng lưới thẻ có ảnh, bộ lọc, và các mục ngoài MVP.
- `Asset/coldi/Coldi Freight - Home Screen (Role Chủ Hàng) Pro Max.png`: trang chủ chủ hàng trên khung điện thoại, có tiến độ, ETA, chứng từ và xe gần.
- `Asset/coldi/Coldi Driver — Trang chủ - 2026-10-14T07_58_30.305Z.png`: trang chủ tài xế trên khung điện thoại, lời chào, ba số, một chuyến, nút xem chi tiết.

## 4. Ảnh không mở lại trong lượt này

Các ảnh tạo đơn bước 1–3, quản lý đơn, chi tiết đơn, popup nhận chuyến, popup phân công, đội xe, hồ sơ tài xế, GPS và `chuyến hàng.png` đã được xem ở các lượt FE trước. Lượt này không sửa những màn đó nên không đối chiếu lại từng pixel. Không có ảnh desktop riêng cho trang chủ tài xế.

## 5. Lỗi desktop đã xác nhận

- Header khách luôn hiện Đăng nhập và Đăng ký, kể cả khi đã có phiên.
- `/dang-ky` không tạo tài khoản. Nút Đăng ký trên header làm người xem tưởng đăng ký công khai đang mở.
- Từ 1200px đến 1439px, menu desktop và nút hamburger cùng hiện vì chữ tài khoản chỉ xuất hiện từ 1440px.
- FAQ khách vẫn nói các tính năng theo vai trò đang được phát triển.
- Câu đăng nhập của tài xế vẫn nói khu này chưa mở.
- Câu dẫn vào khu làm việc vẫn nói trao đổi và vị trí chưa mở.

## 6. Việc đã sửa

Header khách đọc phiên hiện có. Chưa đăng nhập hoặc đang tải phiên thì dẫn Đăng nhập. Đã đăng nhập thì một nút chữ và một nút biểu tượng cùng dẫn đúng nhà của vai trò đó: chủ hàng `/shipper`, nhà xe `/carrier`, tài xế `/driver`, quản trị `/admin`. Nhãn là "Vào khu làm việc". Không có bộ chuyển vai trò.

Đăng ký biến khỏi header desktop và menu thu gọn. Route `/dang-ky` vẫn còn và vẫn nói đăng ký công khai chưa mở.

Mốc desktop của chữ tài khoản và nút menu chuyển về 1200px, cùng mốc với menu ngang đang có.

FAQ, câu trên trang đăng nhập của tài xế, và câu "Vào khu làm việc" được viết lại cho khớp việc FE-02, FE-03 và FE-04 đã làm. Hồ sơ doanh nghiệp và chứng từ vẫn ghi là chưa mở.

## 7. Layout và header dùng chung

Vẫn một `GuestLayout`, một `AuthLayout`, một `WorkspaceLayout`. Không thêm MainLayout. Sidebar nhà xe vẫn navy. Sidebar chủ hàng và tài xế vẫn sáng. Logo trong khu làm việc vẫn theo vai trò. Không đổi chiều cao header workspace, độ rộng nội dung, hay danh mục điều hướng của ba vai trò.

## 8. Trang khách

Giữ nguyên hình xe, chuỗi cinematic, màu, và nội dung marketing còn đúng. Chỉ sửa header, mốc menu, FAQ, và câu dẫn tài khoản.

## 9. Chủ hàng

Không sửa trang chủ, tạo đơn, danh sách, hay chi tiết. Trang chủ tại 1440 vẫn có "Đăng đơn hàng" là hành động chính, số liệu và thẻ lấy từ đơn thật.

## 10. Nhà xe

Không sửa sàn, nhận chuyến, phân công, đội xe, hay tài xế. Trang chủ và trang tìm chuyến tại 1440 và 1280 không tràn ngang. Lúc xem, sàn đang mở không có đơn PUBLISHED nên hiện trạng thái trống thật.

## 11. Tài xế

Không sửa trang chủ, danh sách, chi tiết, GPS, hay đổi mật khẩu. Cột nội dung vẫn hẹp trên nền rộng vì ảnh tham chiếu là bố cục điện thoại. Kéo thẻ đó full chiều ngang làm nút và ba số bị giãn.

## 12. Cố ý không đổi

- Toàn bộ trang workspace của FE-02, FE-03, FE-04.
- Composition cinematic và các section marketing còn đúng.
- Trang đăng ký, ngoài việc không còn được header quảng cáo.
- Admin placeholder.
- Bộ lọc sàn, thẻ đơn, dialog nhận chuyến và phân công.
- Thanh điều hướng điện thoại. Không thiết kế bottom nav mới.

## 13. Khác biệt hình còn lại

- Ảnh `homepagecarthinh.png` là lưới thẻ có ảnh hàng, số nguồn hàng, hỗ trợ, và nhiều mục sidebar. MVP không có ảnh hàng, không có số liệu giả, và không có các mục đó. Sàn hiện tại giữ danh sách vận hành của FE-02.
- Ảnh trang chủ chủ hàng có phần trăm hành trình, ETA, chứng từ, đánh giá và xe gần. Những mục đó ngoài MVP.
- Ảnh trang chủ tài xế là điện thoại, có chuông và thanh dưới. Desktop giữ sidebar sáng và không thêm các mục đó.
- Header khách có thể hiện Đăng nhập trong khoảnh khắc phiên còn đang tải, rồi đổi thành Vào khu làm việc.
- Ô ngày trên sàn dùng định dạng của trình duyệt.
- Chưa chụp riêng 1280 cho trang chủ tài xế. Đã đo 1280 cho chủ hàng, nhà xe, và trang tìm chuyến.
- Chưa mở lại tạo đơn, chi tiết đơn, chuyến của tôi, đội xe, chi tiết chuyến tài xế, hay đổi mật khẩu trong lượt này.

## 14. Trình duyệt

Đã làm, mục 2. Không đánh dấu màn nào là đã được nghiệm thu.

Phiên trình duyệt kết thúc ở tài khoản nhà xe demo, đang đứng tại `/carrier/tim-chuyen`.

## 15. Kiểm thử tự động

- Server: typecheck pass, lint pass, `npm test` 67 pass / 0 fail, build pass. Baseline trước FE-05A là 66. Thêm một test cho đường header khách.
- Web: lint pass, `tsc -b` pass, production build pass.
- Web không có trình chạy test giao diện.

Lần chạy test đầu thất bại vì helper import alias `@/`. Helper được đổi sang import tương đối, cùng cách với `logoDestination`. Lần chạy đầy đủ sau đó là 67 pass.

## Phụ thuộc bản đồ lộ trình

Bản đồ điểm lấy → điểm giao chưa được vẽ. Đơn chỉ lưu địa chỉ dạng chữ, không có tọa độ hai đầu. Muốn có bản đồ thật cần quyết định sản phẩm: lưu tọa độ khi đăng đơn, hoặc duyệt một bước geocoding. Không được tự bịa tọa độ, khoảng cách hay ETA.

Vị trí xe là GPS do tài xế gửi. API đó chỉ mở cho chủ hàng của đơn và tài xế được phân công. Trang nhà xe không nhận dữ liệu này. Khóa Mapbox công khai hiện chưa được cấu hình.

Người dùng chưa chấp nhận giao diện. Sàn nhà xe chưa giống `Asset/coldi/homepagecarthinh.png`, chi tiết đơn chưa có trải nghiệm bản đồ, và logo sidebar bị cắt khi cuộn.

Đã sửa trong working tree, chưa commit:

- Thẻ sàn dùng vùng ảnh lớn, mã đơn thật, trạng thái thật, hàng, tuyến, yêu cầu xe, giờ bốc, giá niêm yết và nút Xem đơn. Ảnh hàng không được bịa.
- Lưới ba cột đã có trên `/carrier` và `/carrier/tim-chuyen` khi có đơn PUBLISHED. Lúc xem, sàn đang mở vẫn trống.
- Xem trước bố cục, chỉ khi dev và `?xem-truoc-bo-cuc=1`. Ba thẻ ghi rõ không phải đơn trên sàn và không ghi database.
- Sidebar dính `top` và cao bằng màn hình. Logo không còn trượt khỏi mép trên khi cuộn.
- Chi tiết nhà xe chỉ còn một câu: địa chỉ hai đầu chưa có vị trí trên bản đồ. Trang nhà xe không gọi API GPS của chủ hàng.
- Khối GPS chủ hàng nói rõ đây là vị trí xe, không phải tuyến điểm lấy–điểm giao. Nút Mở bản đồ vẫn chỉ hiện khi có tọa độ và khóa Mapbox công khai.

Lượt đối chiếu sau phản hồi, vẫn chưa được nghiệm thu:

- Lưới xem trước ba cột đã chụp đủ tại 1440 và 1280. Cấu trúc thẻ gần ảnh `homepagecarthinh.png`: vùng ảnh, mã, trạng thái, hàng, tuyến, xe, giờ bốc, giá, đơn vị, nút Xem đơn. Chưa giống ảnh ở chỗ không có ảnh hàng thật, không có số lượng nguồn hàng, không có huy hiệu xác minh, và bộ lọc là bộ lọc đang chạy.
- Tham số `xem-truoc-bo-cuc` chỉ ở trình duyệt dev. Danh sách sàn thật không gửi tham số này lên API. Sàn đang mở vẫn là 0 đơn.
- Giờ bốc trên thẻ tách ngày và khung giờ, để giá không nằm chen vào dòng lịch khi thẻ hẹp.
- Chi tiết nhà xe gom điểm lấy và điểm giao thành hai nơi, hàng hóa thành một đoạn, giá và phân công đứng riêng. Không hiện mã trạng thái kỹ thuật. Timeline nhà xe ẩn câu giải thích kỹ thuật.
- Sidebar đã đo khi đang cuộn: nhà xe, chủ hàng và tài xế, cả 1280 và 1440. Logo tài xế trước khi dính bị khuất; sau khi dính thì còn trong khung.

Chưa làm, vì chưa có dữ liệu hoặc quyền:

- Tọa độ điểm lấy và điểm giao. Địa chỉ đang là chữ.
- Geocoding, tuyến, khoảng cách, ETA.
- API vị trí cho nhà xe. `GET /api/shipments/:id/location` chỉ dành cho chủ hàng của đơn. Tài xế được phân công dùng route riêng.
- Khóa `VITE_MAPBOX_PUBLIC_TOKEN`. `web/.env.local` không có. `web/.env.example` để trống. Không thử tile với khóa giả.

## Đối chiếu đa vai, chưa nghiệm thu

Lượt này chỉ chỉnh trình bày desktop. Không đổi quyền, không ghi dữ liệu nghiệp vụ, không thêm đăng ký.

- Trang chủ chủ hàng: tuyến nổi trên thẻ theo dõi, thẻ đơn có giá và nút rõ hơn. Đơn đã giao dùng “Xem thông tin vị trí”, không gọi đó là theo dõi trực tiếp.
- Trang chủ tài xế: số liệu và chuyến đang làm đứng cạnh nhau trên desktop, thẻ không kéo full bề ngang.
- Chi tiết tài xế: hai điểm lấy/giao, một khối hàng và xe, nút xác nhận đứng trước giá. Điều kiện xác nhận không đổi.
- GPS tài xế: câu ngắn theo giai đoạn chờ lấy, đang chạy và đã giao.
- Timeline vẫn giữ mốc đã ghi. Mốc suy từ dữ liệu cũ có một câu phân biệt, không bịa thêm mốc.
- Đăng nhập dùng ảnh đường từ trang khách và nền chấm, form vẫn là phần chính. Trang chủ điện ảnh không đổi. `/dang-ky` vẫn chưa vận hành.

## Sàn nhà xe một trang, chưa nghiệm thu

Lượt Carrier sau mục “Đối chiếu đa vai” gỡ preview khỏi giao diện. Hai đoạn phía trên vẫn mô tả lượt xem trước, khi query `xem-truoc-bo-cuc` còn tồn tại. Query đó không còn là một màn hình. Sàn thật vẫn là `/carrier/tim-chuyen`. Lúc kiểm, sàn phát triển có 0 đơn PUBLISHED nên lưới ba thẻ đơn thật chưa được bấm.

Bộ lọc chính còn ô tìm, nhóm nhiệt và sắp xếp. Bộ lọc còn lại nằm sau “Bộ lọc khác”. Trang chủ nhà xe bỏ bốn ô trùng sidebar. Chi tiết nhà xe gom số đo trống và không lặp chữ “Tài xế” khi tên đã chứa chữ đó. Bản đồ tuyến vẫn chưa vẽ được vì địa chỉ là chữ.

Đăng ký SHIPPER/CARRIER, dấu xác thực doanh nghiệp và role WAREHOUSE được ghi là quyết định làm sau tại `docs/product/COLDI_v2.4_Product_Decisions_2026-10-17.md`. Chưa triển khai. Checklist ảnh Carrier nằm ở `docs/frontend/FE-05A_Visual_Acceptance_and_Carrier_Backlog_2026-10-17.md`. Không màn nào được đánh dấu đã nghiệm thu.

## 16. Để FE-05B hoặc sau

- Diễn tập có ghi dữ liệu: đăng đơn, nhận chuyến, phân công, lấy hàng, giao hàng, chat, GPS, đổi mật khẩu tạm.
- Token Mapbox và tile bản đồ.
- Tối ưu mobile.
- Đối chiếu pixel các ảnh prototype không được triển khai vì nằm ngoài MVP.
- Nghiệm thu hình ảnh của người dùng.
