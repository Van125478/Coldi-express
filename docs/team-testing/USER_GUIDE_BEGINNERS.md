# Cách dùng COLDI — chủ hàng, nhà xe, tài xế

File này là hướng dẫn bấm màn hình. Nghĩa nghiệp vụ của từng luồng, bảng giá và phần đã chốt nằm ở [mô tả dự án và luồng nghiệp vụ](../v2.10/00_MO_TA_DU_AN_VA_LUONG.md).

Đọc file này sau khi website đã mở tại `http://127.0.0.1:5173` theo [TEAM_TESTING_GUIDE.md](TEAM_TESTING_GUIDE.md).

App điện thoại không dùng các đường `/shipper` trong file này. Cách bấm app nằm ở [mobile/DEMO.md](../../mobile/DEMO.md) và [mobile/NGHIEM_THU.md](../../mobile/NGHIEM_THU.md).

Không có ảnh chụp màn hình trong file này. Làm theo chữ trên nút. Ảnh Mapbox không được đưa vào vì tile thật chưa được chứng minh.

Mọi bước có ghi **QUY TRÌNH KIỂM THỬ** là cách bấm để người thử tự làm trên database dùng một lần. Đó không phải biên bản PASS. Chuỗi đầu-cuối chưa được ghi nhận đã chạy thành công trong đợt viết tài liệu.

## Vai trò

| Mã | Tên trên màn hình | Khách này làm gì |
| --- | --- | --- |
| SHIPPER | Chủ hàng | Đăng đơn lạnh và theo dõi đơn của mình |
| CARRIER | Nhà xe | Xem đơn đang tìm xe, tự nhận, phân công xe và tài xế |
| DRIVER | Tài xế | Chỉ thấy chuyến đã được nhà xe gán, xác nhận lấy rồi giao |
| ADMIN | Quản trị | Đăng nhập vào trang báo khu vận hành chưa mở |

Khách chưa đăng nhập mở được trang giới thiệu, không tạo được đơn và không nhận chuyến. Khách không phải vai thứ năm trong mã.

Một tài khoản một vai. Muốn đổi vai: `Đăng xuất`, rồi đăng nhập tài khoản kia.

Trạng thái đơn người dùng nhìn thấy:

| Mã trong dữ liệu | Chữ trên màn hình | Nghĩa |
| --- | --- | --- |
| PUBLISHED | Đang tìm xe | Chủ hàng đã đăng. Chưa có nhà xe nhận |
| MATCHED, chưa gán đủ xe và tài xế | Đã có nhà xe nhận chuyến | Đã nhận. Chưa phân công xong |
| MATCHED, đã gán xe và tài xế | Chờ lấy hàng | Tài xế phải tự xác nhận lấy. Nhà xe không thay tài xế bấm |
| IN_TRANSIT | Đang vận chuyển | Tài xế đã xác nhận lấy |
| DELIVERY_CONFIRMED | Đã xác nhận giao hàng | Hàng đã được xác nhận giao. Chưa phải đã thanh toán |

Mã `COMPLETED`, hủy đơn, và sự cố không có nút trong luồng này. Đừng tìm nút thanh toán.

## Chủ hàng

Chỉ tài khoản SHIPPER vào được các trang dưới. Người khác bị đưa ra khỏi khu này.

### `/shipper` — Trang chủ

**Mục đích:** thấy đơn của chính tài khoản, chia nhóm.

**Thấy gì:** tiêu đề trang chủ chủ hàng. Bốn nhóm: `Đang tìm xe` (“Chưa có nhà xe nhận.”), `Đã có nhà xe nhận`, `Đang vận chuyển`, `Đã giao` (“Đã xác nhận giao. Chưa phải đã thanh toán.”). Menu trái: `Trang chủ`, `Tạo đơn`, `Quản lý đơn`.

**Nút:** khi đã có đơn, nút đăng đơn nằm ở menu `Tạo đơn`. Khi danh sách trống, nội dung trang có `Đăng đơn hàng`.

**Việc tiếp:** bấm `Tạo đơn` nếu cần đơn mới, hoặc mở một đơn có sẵn.

**Dữ liệu:** trang này đọc đơn. Không đổi trạng thái.

### `/shipper/tao-don` — Tạo đơn, ba bước

**Mục đích:** niêm yết một đơn. Đơn hợp lệ thành `PUBLISHED`, chữ `Đang tìm xe`. Nghĩa là đang chờ nhà xe. Không nghĩa là nhà xe đã nhận.

**Điều kiện:** đã đăng nhập chủ hàng.

Form có dòng `BƯỚC 1/3`, `2/3`, `3/3`.

**Bước 1 — Điểm bốc hàng.** Bắt buộc, trừ email:

- `Tên công ty / kho gửi`
- `Địa chỉ lấy hàng` — chữ, chưa phải tọa độ
- `Người bốc hàng`
- `Số điện thoại lấy hàng` — 8 đến 20 ký tự, 8 đến 15 chữ số
- `Email nhận thông báo` — bỏ trống được. Nếu điền thì phải là email hợp lệ, tối đa 160 ký tự
- `Ngày lấy hàng`
- `Giờ bắt đầu bốc hàng` và `Giờ kết thúc bốc hàng` — giờ bắt đầu phải sớm hơn giờ kết thúc

Nút `Tiếp tục: Điểm giao hàng`. Nút chỉ sang bước sau khi các ô của bước này hợp lệ.

**Bước 2 — Điểm giao hàng.** Cùng kiểu với bước 1: công ty hoặc kho nhận, địa chỉ, người nhận, điện thoại, email kho nhận để trống được, `Ngày giao hàng muộn nhất` không được trước ngày lấy, khung giờ nhận có giờ bắt đầu sớm hơn giờ kết thúc.

Nút `Quay lại` và `Tiếp tục: Hàng hóa và xe`.

**Bước 3 — Hàng hóa và xe.** Tất cả bắt buộc:

- `Mô tả hàng hóa`
- `Nhóm nhiệt`: `Lạnh mát`, `Đông`, hoặc `Cực lạnh`. Không có ô độ C
- `Trọng lượng` tính bằng tấn, lớn hơn 0, tối đa 100000, tối đa 3 số thập phân
- `Thể tích` tính bằng mét khối, cùng kiểu
- `Số thùng` là số nguyên từ 1 đến 1000000
- `Yêu cầu xe` là câu chữ
- `Giá cước niêm yết` là số nguyên đồng, lớn hơn 0. Đây là giá niêm yết, không phải đã thu tiền

Khối `Xem lại trước khi đăng` hiện lại điểm lấy và điểm giao. Nút `Hoàn tất và đăng đơn`. Khi đang gửi, nút thành `Đang đăng đơn`.

**Kết quả mong đợi:** câu `Đăng đơn thành công. Đơn đang tìm xe.`

**Cách kiểm tra:** vào `Quản lý đơn`, nhóm đang tìm xe, mở đơn, chép mã đơn trên trang chi tiết. Mã là một chuỗi ký tự, nhãn `Mã đơn`.

**Lỗi thường gặp:** ô trống, giờ kết thúc không sau giờ bắt đầu, ngày giao trước ngày lấy, giá có chữ hoặc số 0. Trang giữ bạn ở bước có lỗi.

**Dữ liệu:** bấm `Hoàn tất và đăng đơn` tạo một đơn mới. Chỉ làm trên database thử.

### `/shipper/don-hang` — Quản lý đơn

**Mục đích:** liệt kê đơn của tài khoản này, lọc theo nhóm trạng thái.

**Thấy gì:** các đơn mình đã đăng. Không thấy đơn của chủ hàng khác.

**Việc tiếp:** mở một đơn để vào chi tiết.

**Dữ liệu:** chỉ đọc.

### `/shipper/don-hang/:id` — Chi tiết một đơn

Thay `:id` bằng mã đơn thật trên thanh địa chỉ.

**Mục đích:** xem trạng thái, phân công, timeline, chat và vị trí.

**Thấy gì:**

- Huy hiệu trạng thái tiếng Việt. Không còn dòng mã thô kiểu `DELIVERY_CONFIRMED` trên trang này.
- `Mã đơn` và chuỗi id. Dùng chuỗi này khi so GPS với nhà xe. Hai ảnh khác tuyến, ví dụ Long An → Bình Dương và Long An → Đồng Nai, là hai đơn khác nhau.
- Khối phân công: khi chưa có nhà xe, câu gần với “Đơn đang mở, chưa có nhà xe nhận.” Khi đã nhận mà chưa gán xe, câu gần với “Đã có nhà xe nhận. Chưa phân công xe và tài xế.”
- Timeline: chỉ mốc đã ghi. Năm mốc của luồng đủ là đăng, nhận, phân công, xác nhận lấy, xác nhận giao. Trang không bịa mốc còn thiếu.
- Chat: mục [Chatbox](#chatbox). Nếu chưa nhà xe nào mở trao đổi, câu `Chưa có nhà xe nào nhắn tin về đơn này.`
- Vị trí: mục [GPS và Mapbox](#gps-và-mapbox). Chủ hàng chỉ xem đơn của mình.

**Giao hàng:** khi tài xế đã xác nhận giao, nhóm trên trang chủ là `Đã giao`, gợi ý `Đã xác nhận giao. Chưa phải đã thanh toán.` Không có nút thanh toán.

**Dữ liệu:** mở trang là đọc. Gửi tin nhắn là ghi một tin.

## Nhà xe

Chỉ tài khoản CARRIER. Menu: `Sàn chuyến`, `Tìm chuyến`, `Chuyến của tôi`, `Đội xe`, `Tài xế`.

### `/carrier` — Sàn chuyến, trang chủ nhà xe

**Mục đích:** xem chuyến nhà xe này đã nhận.

**Thấy gì:** thẻ chuyến đã nhận nếu có dữ liệu. Nút trên thẻ là `Phân công` khi còn thiếu xe hoặc tài xế, hoặc `Xem` khi không còn việc phân công đó.

**Không thấy:** đơn đang tìm xe của cả sàn. Đơn đó ở `Tìm chuyến`.

**Dữ liệu:** đọc.

### `/carrier/tim-chuyen` — Sàn đơn đang tìm xe

**Mục đích:** tìm đơn `PUBLISHED`. Đơn đã có nhà xe nhận không nằm ở đây.

**Thấy gì:** ô `Tìm theo hàng, điểm lấy hoặc điểm giao`. Nhóm nhiệt `Tất cả`, `Lạnh mát`, `Đông`, `Cực lạnh`. Sắp xếp: `Mới đăng`, `Thời gian lấy hàng`, `Giá thấp đến cao`, `Tải trọng nặng đến nhẹ`. Nút `Bộ lọc khác` mở thêm điểm lấy, điểm giao, tải trọng và khoảng ngày lấy.

Mỗi thẻ có `Xem đơn`, `So sánh`, và có thể có `Nhận chuyến` cùng `Nhắn chủ hàng`. Mã ngắn trên thẻ là sáu ký tự cuối, có dấu `#`. Mã đầy đủ nằm ở trang chi tiết, nhãn `Mã đơn`. So sánh tối đa 2 đơn, chữ dạng `So sánh 0/2`. So sánh không lưu trên server và không nhận chuyến. `Nhận chuyến` trên thẻ mở cùng hộp xác nhận với nút trong trang chi tiết. `Nhắn chủ hàng` trên thẻ nhảy tới khối chat của đơn, chưa gửi tin.

**Vì sao sàn có thể trống:** chưa có đơn đang tìm xe, hoặc bộ lọc loại hết. Câu khi không lọc: `Hiện không có đơn mở. Đơn mới hiện tại đây khi chủ hàng niêm yết.` Xóa bớt điều kiện nếu bạn vừa lọc. Sàn trống không phải mất trang.

**Dữ liệu:** tìm và lọc chỉ đọc. `So sánh` chỉ đổi màn hình máy bạn.

### `/carrier/chuyen/:id` — Chi tiết trước và sau khi nhận

**Chat trước khi nhận:** khối `Nhắn chủ hàng`. Câu `Gửi tin không nhận chuyến.` Nút `Mở trao đổi`. Bấm nút này tạo cuộc trao đổi. Đó là ghi dữ liệu. Chi tiết ô nhập ở mục Chatbox.

**Nhận chuyến:** khối `Nhận chuyến`. Câu `Nhận chuyến chưa gán xe hay tài xế. Chỉ một nhà xe nhận được.` Nút `Nhận chuyến` mở hộp `Xác nhận nhận chuyến`.

Hộp thoại hiện tuyến, hàng, nhóm nhiệt và giá. Câu `Nhận chuyến khóa đơn cho nhà xe này. Chưa gán xe hay tài xế. Gọi điện và nhắn tin không giữ chỗ.`

- `Để sau` hoặc phím Escape: đóng hộp, không nhận.
- `Xác nhận nhận chuyến`: gửi nhận chuyến. Khi đang gửi, nút là `Đang nhận chuyến`.

**Kết quả khi thành công:** đơn chuyển `MATCHED`, chữ `Đã có nhà xe nhận chuyến`. Chưa có xe và tài xế. Nhà xe thứ hai nhận cùng đơn bị từ chối. Ý nghĩa xung đột: một đơn chỉ một nhà xe nhận được.

**Dữ liệu:** `Xác nhận nhận chuyến` ghi nhận chuyến. `Để sau` không ghi.

### `/carrier/chuyen-cua-toi` — Chuyến đã nhận và phân công

**Mục đích:** thấy chuyến nhà xe này đã nhận và gán xe với tài xế.

**Câu đầu trang:** `Chuyến đã nhận, xếp theo việc cần làm. Phân công xe và tài xế trước khi tài xế xác nhận lấy hàng.`

Khi chưa có xe hoặc tài xế trong đội: `Nhà xe chưa có xe hoặc tài xế để phân công.` Tạo ở `Đội xe` và `Tài xế` trước.

Form phân công có hai ô chọn và nút `Phân công xe và tài xế`. Nút chỉ bấm được khi đã chọn cả xe và tài xế. Bấm nút mở hộp xác nhận, chưa ghi ngay. Câu trong khu này: `Phân công chưa phải xác nhận lấy hàng. Tài xế phải tự xác nhận khi đã nhận hàng.`

**Sau khi phân công thành công:** trạng thái vẫn `MATCHED`. Chữ vận hành thành `Chờ lấy hàng`. Việc tiếp theo là tài xế đăng nhập và bấm xác nhận lấy. Phân công lần hai trên cùng đơn không thay cặp xe và tài xế đã gán.

Tài xế bị khóa, hoặc còn mật khẩu tạm chưa đổi, không được chọn để gán.

**Dữ liệu:** xác nhận phân công ghi xe và tài xế lên đơn.

### Đội xe

| Trang | Việc |
| --- | --- |
| `/carrier/doi-xe` | Danh sách xe của nhà xe này |
| `/carrier/doi-xe/xe/moi` | `Thêm phương tiện` |
| `/carrier/doi-xe/xe/:id` | Xem một xe |
| `/carrier/doi-xe/xe/:id/sua` | `Chỉnh sửa xe` |

Form xe: `Tên xe`, `Biển số`, `Loại phương tiện` (`Xe tải lạnh`, `Container lạnh`, `Xe van lạnh`), `Nhóm nhiệt độ hỗ trợ`, `Tải trọng (tấn)`. Nút tạo là `Thêm phương tiện`. Nút sửa là `Lưu thay đổi`. Câu trên form: `Biển số không được kiểm tra với cơ quan đăng kiểm. Lưu xe không nhận chuyến.`

Không có nút xóa xe. Đừng tìm nút đó.

**Dữ liệu:** lưu xe ghi một xe của nhà xe đang đăng nhập. Không nhận chuyến.

### Tài xế của nhà xe

| Trang | Việc |
| --- | --- |
| `/carrier/doi-xe/tai-xe` | Danh sách và form tạo |
| `/carrier/doi-xe/tai-xe/:id` | Hồ sơ một tài xế |

Tạo: ô `Tên hiển thị`, ô `Email đăng nhập`, nút `Tạo tài xế`.

**Mật khẩu tạm:** hiện một lần, nút `Chép mật khẩu` và `Đã giao cho tài xế`. Giao chuỗi đó cho đúng người ngoài kênh an toàn. Đừng chụp màn hình mật khẩu vào issue. Tài xế phải đổi mật khẩu ở `/driver/doi-mat-khau` trước khi được phân công.

Hồ sơ tài xế: `Lưu tên hiển thị`, `Khóa tài khoản` hoặc `Mở khóa`, `Đặt lại mật khẩu`. Mỗi việc khóa, mở, hoặc đặt lại đều có hộp xác nhận và nút `Hủy`.

Khóa và đặt lại mật khẩu bị từ chối khi tài xế đang có chuyến `MATCHED` hoặc `IN_TRANSIT`. Mở khóa không nhận chuyến hộ tài xế.

Tài khoản bị khóa đăng nhập đúng mật khẩu vẫn không vào được, mã `account_locked`.

**Dữ liệu:** tạo, khóa, mở, đặt lại mật khẩu đều ghi tài khoản. Chỉ làm trên database thử.

## Tài xế

Chỉ tài khoản DRIVER đã đổi mật khẩu nếu hệ thống đang yêu cầu đổi. Nếu chưa đổi, mọi trang chuyến đẩy về `/driver/doi-mat-khau`.

Tài xế không thấy sàn và không có nút nhận chuyến.

### `/driver` — Tổng quan tài xế

**Mục đích:** thấy việc cần làm trước.

**Thấy gì:** tiêu đề `Tổng quan tài xế`. Ba số: `Chờ lấy hàng`, `Đang vận chuyển`, `Đã giao`. Bấm một số tới `/driver/chuyen?nhom=pickup`, `transit`, hoặc `delivered`.

Dưới đó là `Chuyến đang cần làm`. Mã chọn chuyến chính như sau: nếu có chuyến đang chờ xác nhận giao thì lấy chuyến đó; không thì lấy chuyến chờ xác nhận lấy. Các chuyến khác còn việc lấy hoặc giao, tối đa ba chuyến theo thứ tự API, nằm ở `Chuyến cần làm khác`. Chỉ một chuyến thì không có cột phụ.

Chuyến đã giao không nằm trong cột phụ.

**Dữ liệu:** đọc.

### `/driver/chuyen` — Chuyến của tôi

**Câu đầu:** `Chuyến nhà xe đã gán cho tài khoản này.` Tài xế không thấy chuyến của tài xế khác và không thấy đơn chưa gán cho mình.

Lọc `Chờ lấy hàng`, `Đang vận chuyển`, `Đã giao` không đổi trạng thái.

### `/driver/chuyen/:id` — Chi tiết và xác nhận

**Xác nhận lấy**, khi nút là `Xác nhận đã lấy hàng`: hộp thoại câu `Xác nhận rằng bạn đã nhận hàng và bắt đầu vận chuyển.` `Hủy` không ghi. Xác nhận thì trạng thái thành `IN_TRANSIT`, câu thông báo `Đã xác nhận lấy hàng. Chuyến đang vận chuyển.`

**GPS** chỉ mở chia sẻ sau bước này. Xem mục GPS. GPS không tự bấm xác nhận.

**Xác nhận giao**, nút `Xác nhận đã giao hàng`: câu `Xác nhận rằng hàng đã được giao đến điểm nhận. Việc này chưa phải thanh toán.` Sau khi xác nhận: `Đã xác nhận giao hàng. Việc này chưa phải thanh toán.` Trạng thái `DELIVERY_CONFIRMED`. Không có bước thanh toán tiếp.

**Dữ liệu:** mỗi xác nhận ghi một lần. Bấm lại không kéo trạng thái lùi và không đổi giờ đã lưu.

### `/driver/doi-mat-khau`

Chỉ khi tài khoản đang bị yêu cầu đổi mật khẩu tạm. Điền mật khẩu mới theo form trên trang. Sau khi đổi, cookie mới được cấp và tài xế vào được `/driver`. Tài khoản demo tạo bằng seed thường không dừng ở trang này.

## Quản trị

`/admin` sau khi đăng nhập ADMIN. Tiêu đề `Khu vận hành quản trị chưa mở`. Câu trên trang: tài khoản quản trị không xem đơn của chủ hàng, không nhận chuyến và không phân công xe. Không có trang duyệt doanh nghiệp, không có trang GPS cho quản trị.

## Chatbox

Chat là tin nhắn giữa chủ hàng của đơn và nhà xe đã bấm `Mở trao đổi` trên đơn đó. Không phải cuộc gọi, không đính kèm file, không biên nhận đã đọc, không trạng thái đang gõ, không thông báo đẩy, không dấu online.

Ứng dụng hỏi tin mới khoảng mỗi 5 giây khi tab đang mở. Không có WebSocket trong mã chat này. Tin của người kia có thể hiện chậm tới vài giây. Không phải mất tin chỉ vì chưa hiện ngay.

**Nhà xe mở:** trên chi tiết đơn, nút `Mở trao đổi`. Lỗi thì câu `Không mở được cuộc trao đổi.`

**Chủ hàng:** trên chi tiết đơn. Chưa ai mở: `Chưa có nhà xe nào nhắn tin về đơn này.` Nhiều nhà xe đã nhắn trước khi một nhà xe nhận đơn: một hàng tab `Cuộc trao đổi theo nhà xe`. Chọn tab của nhà xe cần trả lời. Tiêu đề khung là `Trao đổi với nhà xe`.

**Khung chung:**

- Đầu khung: tiêu đề, tên phía kia, tuyến nếu có, và câu `Nhắn tin không giữ chỗ, không nhận chuyến và không đổi giá niêm yết.`
- Vùng tin cao cố định, cuộn bên trong. Trống thì `Chưa có tin nhắn.`
- Tin của mình: nhãn `Bạn`, bong bóng bên phải, nền navy.
- Tin phía kia: nhãn `Chủ hàng` hoặc tên nhà xe, bong bóng bên trái.
- Ô `Soạn tin`, gợi ý `Nhập tin nhắn`, nút `Gửi tin nhắn`.
- Enter gửi. Shift+Enter xuống dòng. Đang gõ tiếng Việt qua bộ gõ, Enter không gửi nhầm.
- Ô trống không gửi được.
- Gửi lỗi: `Không gửi được tin nhắn. Nội dung vẫn còn trong ô soạn.` Bản nháp còn.
- Khi không còn được viết: `Cuộc trao đổi này không còn nhận tin nhắn mới.` và ô soạn biến mất.

**Quy tắc nghiệp vụ:** gửi tin không nhận chuyến, không giữ chỗ, không đổi giá, không đổi trạng thái. Sau khi nhà xe khác đã nhận đơn, nhà xe thua không viết tiếp. Quyền đọc lại thread cũ của nhà xe thua vẫn là quy tắc tạm, chưa chốt thời gian lưu tin.

## GPS và Mapbox

Bảy việc khác nhau. Đừng gọi tất cả là “bản đồ hỏng”.

| Việc | Nó là gì |
| --- | --- |
| Trạng thái đơn | Đang tìm xe, đã nhận, đang vận chuyển, đã giao |
| Quyền tài xế gửi GPS | Chỉ tài xế được gán, chỉ khi `IN_TRANSIT` |
| Quyền vị trí của trình duyệt | Chrome hoặc Edge hỏi bạn. Từ chối thì không có điểm mới |
| Điểm GPS cuối trong database | Một điểm mới nhất API đang giữ |
| Quyền xem | Chủ hàng xem đơn mình tạo. Nhà xe xem chuyến mình đã nhận. Quản trị và khách không có API xem |
| Mapbox | Vẽ nền bản đồ khi có token `pk.` và có tọa độ |
| Bản đồ lộ trình lấy → giao | Chưa làm. Không phải vị trí xe |

### Trước khi tài xế xác nhận lấy

Trạng thái còn `MATCHED` hoặc `Chờ lấy hàng`. Khối vị trí nói `Chưa có vị trí xe được cập nhật.` Không có điểm bịa. Tài xế thấy `Chia sẻ vị trí mở sau khi xác nhận lấy hàng.` và huy hiệu `Chưa mở`.

### Đang vận chuyển

Tài xế đã xác nhận lấy. Trên chi tiết chuyến của tài xế: `Chuyến đang vận chuyển. Chưa chia sẻ vị trí.` Nút `Bắt đầu chia sẻ vị trí`.

Trình duyệt hỏi quyền vị trí. Câu trên trang: `Trình duyệt sẽ hỏi quyền vị trí. Vị trí chỉ được gửi khi trang này đang mở.` Chấp nhận thì điểm được gửi lên API. Câu `Đang chia sẻ vị trí trên trang này.` Nút đổi thành `Dừng chia sẻ vị trí`.

Giới hạn: đây là trình duyệt, không phải ứng dụng nền. Rời tab thì có thể `Đã tạm dừng vì trang không còn ở trước màn hình.` Tắt trang thì hết gửi. Từ chối quyền: `Trình duyệt đã từ chối quyền vị trí. Xác nhận lấy hàng và giao hàng vẫn thực hiện được.`

Khi gửi thành công, chủ hàng mở **cùng mã đơn** và nhà xe đã nhận mở **cùng mã đơn** đều đọc cùng điểm cuối. Chữ khi điểm còn mới: `Đang vận chuyển.` Tọa độ và giờ `Cập nhật lúc` hiện nếu API trả điểm. Quá 20 phút không có điểm mới: `Vị trí cập nhật đã lâu.` Điểm cũ không bị gán là đang sống nếu chữ đã là câu đó.

Nhà xe chưa nhận đơn không có khối theo dõi vị trí xe. Nhà xe khác không đọc được điểm.

### Bản đồ có vẽ hay chỉ có số

Có tọa độ mà không có token: `Bản đồ chưa được cấu hình. Tọa độ vẫn hiện ở trên.`

Có token mà trình duyệt không vẽ được: `Bản đồ chưa mở được trên trình duyệt này. Tọa độ vẫn hiện ở trên.`

Không có điểm: không có marker để vẽ. Đó không phải lỗi 403 của token.

Token sai hoặc bị Mapbox từ chối: bản đồ không ra tile. Tọa độ chữ vẫn là dữ liệu API. Tile Mapbox chưa có biên bản pass trong dự án này. Đừng chụp một ảnh bịa và gọi là đã chạy.

### Sau khi giao

`Theo dõi trực tiếp đã kết thúc.` Tài xế thấy `Đã giao. Theo dõi trực tiếp đã kết thúc.` và huy hiệu `Đã kết thúc`. Nếu trước đó có điểm, điểm cuối vẫn đọc được như lịch sử. Đừng gọi điểm đó là xe đang chạy.

Nếu giao mà chưa từng gửi điểm: thêm `Chưa có vị trí xe được cập nhật.`

### Cùng một đơn

Trên cả hai màn hình, đọc `Mã đơn` giống nhau từng ký tự rồi mới so vị trí. Khác mã là khác đơn.

### Bản đồ lộ trình

Trên chi tiết nhà xe, khối `Bản đồ lộ trình` nói: `Chưa có bản đồ tuyến giữa điểm lấy và điểm giao. Địa chỉ chưa gắn được vị trí. Mục này không phải vị trí xe.`

Khối `Theo dõi vị trí xe` là GPS. Hai khối không thay nhau. Không có ETA, không có đường đi, không có khoảng cách tính từ địa chỉ chữ.

## Kịch bản kiểm thử từ đầu đến cuối

**QUY TRÌNH KIỂM THỬ. Chưa phải PASS đã xác minh.**

Chỉ chạy trên database mới hoặc database dùng một lần. Đừng chạy trên database phát triển đang có đơn cần giữ. Đừng seed đè tài khoản của database dùng chung. Đợt viết tài liệu này không thực hiện kịch bản này.

Chuẩn bị: MongoDB riêng, `.env` riêng, `npm run seed:demo` rồi `npm run seed:fleet` trên database đó, ba cửa sổ đăng nhập hoặc đăng xuất từng vai. Ghi mã đơn ngay sau khi đăng.

| Bước | Vai | Trang | Việc bấm | Kết quả mong đợi | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| 1 | Người thử | PowerShell `server` | Seed trên database dùng một lần | Bốn tài khoản và một xe demo | Chưa có đơn mới |
| 2 | SHIPPER | `/dang-nhap` rồi `/shipper` | Đăng nhập | Tới trang chủ chủ hàng | — |
| 3 | SHIPPER | `/shipper/tao-don` | Ba bước, `Hoàn tất và đăng đơn` | `Đăng đơn thành công. Đơn đang tìm xe.` | PUBLISHED |
| 4 | SHIPPER | Chi tiết đơn | Chép `Mã đơn` | Một id | PUBLISHED |
| 5 | CARRIER | Đăng xuất, đăng nhập nhà xe | Vào `/carrier/tim-chuyen` | Thấy đơn vừa đăng nếu không lọc mất | PUBLISHED |
| 6 | CARRIER | Thẻ đơn | `Xem đơn` | Đúng mã đơn đã chép | PUBLISHED |
| 7 | CARRIER | Chi tiết | `Mở trao đổi` | Hết câu lỗi mở | Vẫn PUBLISHED |
| 8 | CARRIER | Chat | Gửi một tin thử | Bong bóng `Bạn` | Vẫn PUBLISHED |
| 9 | SHIPPER | Cùng mã đơn | Tab đúng nhà xe, trả lời | Thấy tin nhà xe và tin mình | Vẫn PUBLISHED |
| 10 | Cả hai | Cùng đơn | Xem trạng thái | Chat không làm chữ thành đã nhận | PUBLISHED |
| 11 | CARRIER | Cùng đơn | `Nhận chuyến` rồi `Xác nhận nhận chuyến` | Hộp đã xác nhận | MATCHED |
| 12 | CARRIER | Cùng đơn | Đọc trạng thái | `Đã có nhà xe nhận chuyến`, chưa có xe trên đơn | MATCHED |
| 13 | CARRIER | `/carrier/chuyen-cua-toi` | Chọn xe demo và tài xế demo, xác nhận phân công | Đã gán | MATCHED, chữ Chờ lấy hàng |
| 14 | DRIVER | Đăng nhập tài xế demo | `/driver` | Thấy chuyến ở chờ lấy | MATCHED |
| 15 | DRIVER | Chi tiết chuyến | `Xác nhận đã lấy hàng` | `Đã xác nhận lấy hàng. Chuyến đang vận chuyển.` | IN_TRANSIT |
| 16 | DRIVER | Cùng trang | `Bắt đầu chia sẻ vị trí`, cho phép trình duyệt | `Đang chia sẻ vị trí trên trang này.` | IN_TRANSIT |
| 17 | SHIPPER | Đúng mã đơn | Mở khối vị trí | Có tọa độ hoặc câu chưa có điểm nếu gửi chưa kịp | IN_TRANSIT |
| 18 | CARRIER | Đúng mã đơn | Khối `Theo dõi vị trí xe` | Cùng điểm với chủ hàng | IN_TRANSIT |
| 19 | Cả hai | Cùng khối | Nhìn bản đồ | Chỉ khi có token `pk.` và có tọa độ. Không có token thì câu bản đồ chưa cấu hình. Tile chưa được tính là pass | IN_TRANSIT |
| 20 | DRIVER | Cùng chuyến | `Xác nhận đã giao hàng` | `Đã xác nhận giao hàng. Việc này chưa phải thanh toán.` | DELIVERY_CONFIRMED |
| 21 | SHIPPER và CARRIER | Đúng mã đơn | Đọc timeline | Có các mốc đã xảy ra, không có mốc bịa | DELIVERY_CONFIRMED |
| 22 | SHIPPER | Trang chủ | Nhóm đã giao | `Đã xác nhận giao. Chưa phải đã thanh toán.` | DELIVERY_CONFIRMED |

Không có bước thanh toán. GPS không tự xác nhận lấy hoặc giao.

## Trạng thái MVP hiện tại và các giai đoạn tiếp theo

Phương án B đã được duyệt. Phương án B thay phương án A. MVP cuối cùng bắt buộc có logistics, Package Management, quyền gói, và hạn mức được backend chặn. Bản đang chạy mới có phần logistics ở mức mã. Chưa phải full MVP.

### Đã có mã, nghiệm thu còn mở

- Luồng đơn: đăng, nhận, phân công, lấy, giao.
- Vai SHIPPER, CARRIER, DRIVER, ADMIN và việc nhà xe cấp tài khoản tài xế.
- Sàn và nhận chuyến.
- Chatbox.
- GPS theo quyền ở trên.
- Timeline các mốc đã ghi.

E2E chưa có PASS. Tile Mapbox chưa có PASS. Chat lưu dữ liệu thực chưa có biên bản. Product Owner đã chấp nhận bố cục Carrier Home, phần phân công chuyến của Nhà xe, Driver Home và cấu trúc khung chat Shipper/Carrier. Đây là nghiệm thu bố cục, không phải nghiệm thu chức năng.

### Bắt buộc theo phương án B nhưng chưa làm

- Danh mục gói.
- Màn quản lý gói.
- Quyền đi kèm gói.
- Hạn mức sử dụng.
- Backend từ chối khi vượt hạn mức.
- Chỗ người dùng thấy trạng thái gói.
- Màn quản trị gói nội bộ.

Chưa có số lượng gói, tên gói, giá, hạn mức, chu kỳ, hay cách nâng hạ. Đừng điền số vào khi thử.

### Để sau MVP

- Cổng thanh toán online.
- Tự thu phí.
- VAT và nghiệp vụ tài chính rộng hơn.
- Vai WAREHOUSE.
- Đăng ký công khai.
- Huy hiệu xác thực doanh nghiệp.
- Bản đồ tuyến lấy đến giao, ETA, geofence.

FE-05B chưa bắt đầu. Đừng coi bản team testing là production.
