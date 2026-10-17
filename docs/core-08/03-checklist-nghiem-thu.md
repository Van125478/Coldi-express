# Checklist nghiệm thu Core 07 và Core 08

Có hai phần. Phần A là biên bản đã ghi của người phát triển. Phần B là ô trống để đồng đội tự chạy. Không đánh dấu sẵn các ô của đồng đội.

Core 08 với người mới đạt khi người đó cài được máy theo [thiết lập](01-thiet-lap.md) và đi hết [kịch bản](02-kich-ban-demo.md) mà không cần đoán lệnh. Việc đó chưa được kiểm trên một máy clone sạch.

## A. Biên bản người phát triển, ngày 17/10/2026

Luồng chính đã được bấm trước commit timeline `cd5045300ac4c788deba3c08053ed1a439481d95`. Đây không phải bằng chứng rằng mọi ca từ chối, tranh chấp đồng thời hay bảo mật đã được bấm tay.

Đơn mới, không dùng lại để sửa:

- Mã: `6ad2fc6b0f1e6b36c1404649`
- Mô tả: `Demo Core 07 - Kiem thu Shipment Timeline`

Năm sự kiện đã thấy, đúng thứ tự:

| Mã | Giờ đã thấy trên màn hình |
| --- | --- |
| `PUBLISHED` | 17/10/2026 11:41 |
| `CLAIMED` | 17/10/2026 11:43 |
| `ASSIGNED` | 17/10/2026 11:46 |
| `PICKUP_CONFIRMED` | 17/10/2026 11:49 |
| `DELIVERY_CONFIRMED` | 17/10/2026 11:51 |

Đã đối chiếu bằng tay:

- Chủ hàng tạo đơn.
- Nhà xe tìm thấy và nhận đơn.
- Nhà xe phân công xe demo và tài xế demo đủ điều kiện.
- Tài xế được gán xác nhận lấy hàng.
- Trạng thái trung gian `IN_TRANSIT` hiện ra và còn sau khi tải lại.
- Tài xế đó xác nhận giao hàng.
- Trạng thái cuối `DELIVERY_CONFIRMED` hiện ra.
- Đủ năm sự kiện, đúng thứ tự.
- Tài xế, chủ hàng và nhà xe đã nhận cùng thấy năm sự kiện đó.
- Xác nhận giao hàng không phải thanh toán.

Đơn cũ `6ad25c2fcf4c13c7d5b735dc`, mô tả `Demo Core 06 - Thực phẩm đông lạnh`, đã được mở để đọc. Lịch sử một phần không bịa giờ nhận chuyến và không bịa giờ phân công. Không sửa đơn này.

Test API của commit timeline báo 29 pass, 0 fail, gồm `tests/timeline.test.ts`. Các ca quyền, thử lại và tranh chấp đồng thời nằm trong số đó. Chúng chưa được tái hiện hết bằng tay.

## B. Checklist để đồng đội tự chạy

Để trống cho đến khi chính người đó làm. Tạo một đơn mới. Không đụng hai mã ở phần A.

### Chuẩn bị

- [ ] API `http://127.0.0.1:4000/api/health` trả `status: ok` và `database: connected`
- [ ] Trình duyệt mở `http://127.0.0.1:5173`, không mở localhost
- [ ] Đăng nhập được bốn email demo. Mật khẩu lấy từ `server/.env` của máy đó
- [ ] Có xe `Xe đông lạnh demo Core 05` và tài xế `Tài xế demo`
- [ ] Chi tiết đơn có mục `Lịch sử sự kiện`. Nếu không có, bản đang chạy chưa gồm Core 07

### Kịch bản A — đơn tạo trước Core 07

Chỉ đọc. Máy clone mới không có đơn `6ad25c2fcf4c13c7d5b735dc`. Khi máy không còn đơn cũ, ghi `không áp dụng`, đừng tạo đơn mới rồi gọi là đơn cũ.

- [ ] Mở chi tiết bằng đúng vai trò được xem đơn đó
- [ ] Có câu: `Đơn này được tạo trước khi có lịch sử sự kiện. Chỉ hiện mốc đã lưu thời điểm. Thời điểm nhận chuyến và phân công không được suy diễn.`
- [ ] Mỗi mốc hiện thêm câu: `Mốc đọc từ dữ liệu đã lưu, không phải bản ghi sự kiện mới.`
- [ ] Không có giờ nhận chuyến tự bịa
- [ ] Không có giờ phân công tự bịa
- [ ] Tải lại, trạng thái và các mốc không đổi

### Kịch bản B — đơn mới

Làm theo [kịch bản ba vai trò](02-kich-ban-demo.md), gồm bước tải lại khi đang `IN_TRANSIT` trước lúc giao hàng.

- [ ] Đúng năm mã, đúng thứ tự: `PUBLISHED`, `CLAIMED`, `ASSIGNED`, `PICKUP_CONFIRMED`, `DELIVERY_CONFIRMED`
- [ ] Không có sự kiện thứ sáu, không có `COMPLETED`, không có sự kiện GPS
- [ ] `PUBLISHED` gắn chủ hàng, nhãn `Đang tìm xe`
- [ ] `CLAIMED` gắn nhà xe vừa nhận, nhãn `Đã có nhà xe nhận chuyến`
- [ ] `ASSIGNED` gắn nhà xe đó. Mã trạng thái vẫn `MATCHED`, nhãn `Chờ lấy hàng`
- [ ] Sau lấy hàng, tải lại vẫn `IN_TRANSIT` và đã có `PICKUP_CONFIRMED`
- [ ] `DELIVERY_CONFIRMED` chỉ xuất hiện sau bước đó, kèm câu chưa phải thanh toán
- [ ] Tải lại lần cuối, năm mốc và giờ không đổi
- [ ] Chủ hàng, nhà xe đã nhận và tài xế được gán đều thấy đủ lịch sử

### Bấm được với một bộ tài khoản demo

| Việc kiểm | Cách làm | Kỳ vọng |
| --- | --- | --- |
| Khách mở trang được bảo vệ | Cửa sổ ẩn danh mở `http://127.0.0.1:5173/shipper` | Về `/dang-nhap` |
| Sai vai trò | Chủ hàng mở `http://127.0.0.1:5173/driver` | `Không có quyền` |
| Quản trị | Đăng nhập `admin.demo@coldi.local` | `/admin` nói khu quản trị chưa mở |
| Giao trước khi lấy | Tài xế mở chuyến vừa phân công | Chỉ có nút lấy hàng |
| Chưa được gán | Tài xế mở `/driver/chuyen` trước khi phân công đơn mới | Đơn đó không có trong danh sách |
| Tải lại sau mỗi bước | F5 sau đăng, nhận, phân công, lấy và giao | Nhãn và timeline giữ bước vừa lưu |
| Hết phiên thực tế | Bấm `Đăng xuất`, mở lại `/shipper` | Về trang đăng nhập |

Hai tab cùng một tài khoản nhà xe không chứng minh hai nhà xe độc lập tranh một đơn. Tab thứ hai của cùng nhà xe chỉ cho thấy yêu cầu đến sau bị từ chối khi đơn đã bị nhận. Ca hai nhà xe bấm cùng lúc nằm ở test API, chưa có bài bấm tay vì seed chỉ có một nhà xe.

### Cần thêm tài khoản hoặc chỉ có test API

Chưa đánh dấu đạt bằng giao diện nếu chỉ có một nhà xe demo và một tài xế demo.

- Nhà xe thứ hai mở chuyến riêng của nhà xe thứ nhất. Test API kỳ vọng 404.
- Tài xế thứ hai mở chuyến của tài xế thứ nhất. Test API kỳ vọng 404.
- Hai nhà xe nhận cùng lúc, chỉ một người thắng. Test `claim` đã kiểm tra.
- Hai yêu cầu lấy hàng hoặc giao hàng cùng lúc chỉ lưu một mốc. Test `driver` và `timeline` đã kiểm tra.

### Việc làm gián đoạn, chỉ trên môi trường cách ly

Không làm hai mục này trên cơ sở dữ liệu demo đang dùng chung trong buổi nghiệm thu.

- [ ] Tùy chọn: tắt MongoDB của một bản cài riêng, rồi mở `http://127.0.0.1:4000/api/health`. Kỳ vọng có thể là HTTP 503 và `database: unavailable` nếu tiến trình API vẫn sống. Chưa ghi đây là kết quả đã bấm trên máy demo.
- [ ] Tùy chọn: tắt đúng cửa sổ `npm run dev` của API trên bản cài riêng, rồi tải lại trang. Trang có thể không tải được đơn. Không tắt mọi tiến trình Node.

## Việc cố ý chưa có

Không đánh dấu đạt:

- GPS và bản đồ vị trí
- Chat trong đơn
- Thanh toán, hóa đơn, công nợ
- Màn thêm, sửa, xóa xe hoặc tài xế sau seed
- Hủy đơn, phân công lại, chuyển `COMPLETED`
- Khu quản trị vận hành
- Giao diện WOW mới

Gặp lỗi thì dùng [mẫu báo lỗi](05-mau-bao-loi.md).
