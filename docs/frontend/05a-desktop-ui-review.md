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

## 16. Để FE-05B hoặc sau

- Diễn tập có ghi dữ liệu: đăng đơn, nhận chuyến, phân công, lấy hàng, giao hàng, chat, GPS, đổi mật khẩu tạm.
- Token Mapbox và tile bản đồ.
- Tối ưu mobile.
- Đối chiếu pixel các ảnh prototype không được triển khai vì nằm ngoài MVP.
- Nghiệm thu hình ảnh của người dùng.
