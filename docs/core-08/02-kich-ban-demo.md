# Kịch bản demo ba vai trò

Dùng một đơn mới, tạo trong buổi demo. Không nhận, không phân công và không xác nhận lại các đơn đã có.

Hai đơn chỉ để đọc, không được dùng làm đích thao tác:

- `6ad2fc6b0f1e6b36c1404649`, mô tả `Demo Core 07 - Kiem thu Shipment Timeline`. Luồng chính đã được nghiệm thu trên đơn này ngày 17/10/2026.
- `6ad25c2fcf4c13c7d5b735dc`, mô tả `Demo Core 06 - Thực phẩm đông lạnh`. Đơn này chỉ dùng để xem lịch sử một phần.

Kịch bản timeline chạy trên nhánh đã có commit `cd5045300ac4c788deba3c08053ed1a439481d95`. `main` chưa có mục “Lịch sử sự kiện”.

Chuẩn bị trước: MongoDB, API và Vite đang chạy. `npm run seed:demo` và `npm run seed:fleet` đã chạy trên chính cơ sở dữ liệu đó. Có xe `Xe đông lạnh demo Core 05` và tài xế `Tài xế demo`.

Ghi lại mô tả hàng của đơn mới, ví dụ `Demo nghiệm thu - hàng đông lạnh`, để tìm đúng đơn. Không dùng mã đơn cũ.

Mỗi bước ghi: vai trò, trang, thao tác, giao diện, trạng thái lưu, sự kiện timeline, lỗi hay gặp.

## Chủ hàng

### 1. Đăng nhập

- Vai trò: SHIPPER, `shipper.demo@coldi.local`
- Trang: `http://127.0.0.1:5173/dang-nhap`
- Thao tác: nhập email và mật khẩu đã đặt trong `server/.env`, bấm `Đăng nhập`
- Giao diện: vào `/shipper`. Menu có Tổng quan, Tạo đơn, Đơn của tôi
- Trạng thái: cookie `coldi_session` của chủ hàng. Chưa có đơn mới
- Timeline: chưa có
- Lỗi hay gặp: mở nhầm `localhost` thì đăng nhập bị từ chối. Sai mật khẩu hiện `Email hoặc mật khẩu không đúng.`

### 2 và 3. Tạo và đăng đơn

Đăng đơn là một lần gửi ở bước cuối, không phải ba lần lưu.

- Vai trò: SHIPPER
- Trang: `/shipper/tao-don`
- Thao tác:
  1. Bước `Điểm bốc hàng`. Điền kho gửi, địa chỉ lấy, người bốc, điện thoại, ngày và khung giờ. Email thông báo có thể để trống. Bấm `Tiếp tục: Điểm giao hàng`
  2. Bước `Điểm giao hàng`. Điền kho nhận, địa chỉ giao, người nhận, điện thoại, ngày giao bằng hoặc sau ngày lấy, khung giờ kết thúc sau giờ bắt đầu. Bấm `Tiếp tục: Hàng hóa và xe`
  3. Bước `Hàng hóa và xe`. Điền mô tả hàng dễ tìm, một nhóm nhiệt `Lạnh mát`, `Đông` hoặc `Cực lạnh`, khối lượng, thể tích, số thùng, yêu cầu xe và giá niêm yết là số nguyên VND. Bấm `Hoàn tất và đăng đơn`
- Giao diện: đơn xuất hiện trong `/shipper/don-hang` với nhãn `Đang tìm xe`
- Trạng thái lưu: `PUBLISHED`. Giá là số hiển thị, chưa phải thanh toán
- Timeline: một sự kiện `PUBLISHED`, nhãn `Đã đăng đơn`, người thực hiện hiện `Chủ hàng`, trạng thái sau sự kiện `Đang tìm xe`
- Lỗi hay gặp: thiếu trường bắt buộc thì form không gửi. API từ chối nếu client tự gửi `status` hoặc `shipperId`

### 4 và 5. Kiểm tra đơn vừa đăng

- Vai trò: SHIPPER
- Trang: `/shipper/don-hang`, rồi mở chi tiết `/shipper/don-hang/<id-của-đơn-mới>`
- Thao tác: tìm đúng mô tả hàng vừa nhập. Ghi lại mã đơn trên màn hình để các vai trò sau đối chiếu. Mã này là id MongoDB, không phải mã nghiệp vụ tự đặt
- Giao diện: nhãn `Đang tìm xe`. Khối `Lịch sử sự kiện` có đúng một mốc
- Trạng thái: vẫn `PUBLISHED`, chưa có nhà xe, xe hay tài xế
- Timeline: chỉ `PUBLISHED`
- Lỗi hay gặp: đơn cũ cũng nằm trong danh sách. Chỉ theo dõi đơn có mô tả vừa tạo

Đăng xuất trước khi sang nhà xe.

## Nhà xe

### 6. Đăng nhập

- Vai trò: CARRIER, `carrier.demo@coldi.local`
- Trang: `/dang-nhap`
- Thao tác: đăng xuất nếu còn phiên chủ hàng, đăng nhập nhà xe
- Giao diện: `/carrier`
- Lỗi hay gặp: nếu vẫn thấy menu chủ hàng thì phiên chưa đổi

### 7 và 8. Tìm và xem đơn

- Vai trò: CARRIER
- Trang: `/carrier/tim-chuyen`, rồi `/carrier/chuyen/<id>`
- Thao tác: tìm đúng mô tả hàng. Mở chi tiết. Đọc lộ trình và liên hệ kho. Không gọi điện để giữ chỗ
- Giao diện: nhãn `Đang tìm xe`. Có nút `Nhận chuyến`. Câu trên trang nói nhận chuyến chưa gán xe hay tài xế
- Trạng thái: vẫn `PUBLISHED`
- Timeline: vẫn một sự kiện `PUBLISHED`. Nhãn người đăng là `Chủ hàng`. Trang nhà xe không hiện email thông báo của chủ hàng
- Lỗi hay gặp: sàn trống khi không còn đơn `PUBLISHED`, hoặc API chưa chạy

### 9, 10 và 11. Nhận chuyến

- Vai trò: CARRIER
- Trang: chi tiết đơn đang mở, hoặc nút `Nhận chuyến` trên `/carrier/tim-chuyen`
- Thao tác: bấm `Nhận chuyến` một lần
- Giao diện: đơn rời sàn tìm chuyến và xuất hiện ở `/carrier/chuyen-cua-toi` với nhãn `Đã có nhà xe nhận chuyến`
- Trạng thái: `MATCHED`, `carrierId` là nhà xe đang đăng nhập. Chưa có `vehicleId` và `driverId`
- Timeline: thêm `CLAIMED`, nhãn `Nhà xe đã nhận chuyến`, trạng thái sau sự kiện `Đã có nhà xe nhận chuyến`
- Lỗi hay gặp: bấm lần hai trên một tab đã cũ có thể nhận báo đơn không còn mở. Chỉ nhà xe thắng mới thấy đơn trong chuyến của mình

### 12, 13 và 14. Phân công

- Vai trò: CARRIER
- Trang: `/carrier/chuyen-cua-toi`
- Thao tác: với đơn vừa nhận, chọn xe `Xe đông lạnh demo Core 05` và tài xế `Tài xế demo`. Nút `Phân công xe và tài xế` chỉ bấm được khi đã chọn cả hai. Bấm một lần
- Giao diện: nhãn đổi thành `Chờ lấy hàng`. Trang vẫn nói chưa xác nhận lấy hàng
- Trạng thái: canonical vẫn `MATCHED`. Đã có `vehicleId` và `driverId`. Chưa có `pickupConfirmedAt`
- Timeline: thêm `ASSIGNED`, nhãn `Đã phân công xe và tài xế`, trạng thái sau sự kiện `Chờ lấy hàng`, dòng chi tiết nêu tên xe và `Tài xế demo`
- Lỗi hay gặp: không có xe hoặc tài xế trong danh sách nghĩa là chưa chạy `npm run seed:fleet`, hoặc tài xế không gắn với nhà xe này. Phân công lần hai bị từ chối và không đổi cặp xe-tài xế đã lưu

Đăng xuất.

## Tài xế

### 15 và 16. Mở chuyến được giao

- Vai trò: DRIVER, `driver.demo@coldi.local`
- Trang: `/driver`, rồi `/driver/chuyen`, rồi `/driver/chuyen/<id>`
- Thao tác: đăng nhập tài xế demo. Mở đúng mô tả hàng vừa phân công
- Giao diện: nhãn `Chờ lấy hàng`. Có nút `Xác nhận đã lấy hàng`. Chưa có nút giao hàng
- Trạng thái: `MATCHED`, đã phân công
- Timeline: ba sự kiện `PUBLISHED`, `CLAIMED`, `ASSIGNED`. Tài xế thấy tên nhà xe nếu có tên hiển thị. Không thấy email chủ hàng
- Lỗi hay gặp: chuyến không có trong danh sách nếu phân công chưa lưu, hoặc đăng nhập nhầm tài xế không được gán

### 17, 18 và 19. Xác nhận lấy hàng, rồi dừng lại

Xác nhận giao hàng chưa xuất hiện trước khi lấy hàng thành công. Khi chuyến còn `Chờ lấy hàng`, tài xế chỉ thấy nút `Xác nhận đã lấy hàng`.

- Vai trò: DRIVER được gán
- Trang: `/driver/chuyen/<id>`
- Thao tác: bấm `Xác nhận đã lấy hàng`. Đọc câu xác nhận. Bấm `Ghi nhận xác nhận`. `Hủy` chỉ đóng khung, không gửi
- Giao diện ngay sau khi gửi: nhãn `Đang vận chuyển`. Câu trên khung nói thao tác không phải thanh toán
- Trạng thái: `IN_TRANSIT`. Có `pickupConfirmedAt` do máy chủ tạo và `pickupConfirmedBy` là tài xế đang đăng nhập
- Timeline: thêm `PICKUP_CONFIRMED`, nhãn `Đã xác nhận lấy hàng`, trạng thái sau sự kiện `Đang vận chuyển`
- Lỗi hay gặp: nếu bấm giao hàng trong lúc nhãn vẫn là `Chờ lấy hàng`, đó không phải bước của kịch bản. Nút giao chưa được mở

Sau khi lấy hàng thành công, chưa bấm giao. Làm đủ bốn việc này và ghi lại màn hình trung gian:

1. Tải lại trang chi tiết tài xế.
2. Xác nhận nhãn `Đang vận chuyển` vẫn còn. Đó là trạng thái `IN_TRANSIT`.
3. Xác nhận timeline đã có `PICKUP_CONFIRMED` và chưa có `DELIVERY_CONFIRMED`.
4. Lưu ảnh hoặc ghi chú mốc trung gian này.

Chỉ sau bốn việc đó mới sang bước giao hàng. Nút `Xác nhận đã giao hàng` lúc này mới là thao tác đúng.

### 20, 21 và 22. Xác nhận giao hàng

- Vai trò: DRIVER được gán, sau khi `IN_TRANSIT` đã được tải lại và còn đúng
- Trang: cùng chi tiết chuyến
- Thao tác: bấm `Xác nhận đã giao hàng`, rồi `Ghi nhận xác nhận`
- Giao diện: nhãn `Đã xác nhận giao hàng`. Không còn nút xác nhận. Câu ghi nhận nói việc này chưa phải thanh toán
- Trạng thái: `DELIVERY_CONFIRMED`. Có `deliveryConfirmedAt` và `deliveryConfirmedBy`. Mốc lấy hàng cũ vẫn còn. Trạng thái không thành `COMPLETED`
- Timeline: thêm `DELIVERY_CONFIRMED`, nhãn `Đã xác nhận giao hàng`, chi tiết `Xác nhận giao hàng chưa phải thanh toán.`
- Lỗi hay gặp: tải lại trang. Nếu nhãn quay về `Chờ lấy hàng` hoặc mất `PICKUP_CONFIRMED`, xác nhận chưa được máy chủ lưu

## Đối chiếu ba vai trò

Đăng xuất giữa các vai trò.

### 23. Chủ hàng

- Trang: `/shipper/don-hang/<id>`
- Kỳ vọng: nhãn `Đã xác nhận giao hàng`. Cước vẫn ghi chưa phải thanh toán. Timeline đủ năm mốc bên dưới

### 24. Nhà xe đã nhận

- Trang: `/carrier/chuyen/<id>` từ mục Chuyến của tôi
- Kỳ vọng: cùng nhãn và cùng năm sự kiện. Đơn không quay lại sàn tìm chuyến

### 25. Tài xế đã được gán

- Trang: `/driver/chuyen/<id>`
- Kỳ vọng: cùng năm sự kiện, không còn nút xác nhận

### 26. Đúng năm sự kiện, đúng thứ tự

| Thứ tự | Mã sự kiện | Nhãn trên màn hình | Trạng thái đơn sau sự kiện |
| --- | --- | --- | --- |
| 1 | `PUBLISHED` | Đã đăng đơn | Đang tìm xe |
| 2 | `CLAIMED` | Nhà xe đã nhận chuyến | Đã có nhà xe nhận chuyến |
| 3 | `ASSIGNED` | Đã phân công xe và tài xế | Chờ lấy hàng |
| 4 | `PICKUP_CONFIRMED` | Đã xác nhận lấy hàng | Đang vận chuyển |
| 5 | `DELIVERY_CONFIRMED` | Đã xác nhận giao hàng | Đã xác nhận giao hàng |

Người thực hiện phải khớp phiên đã bấm: chủ hàng đăng đơn, nhà xe nhận và phân công, tài xế demo xác nhận lấy và giao. Giờ trên mốc là giờ máy chủ, hiển thị theo `Asia/Ho_Chi_Minh`, dạng `ngày/tháng/năm giờ:phút`. Tải lại không thêm mốc và không đổi giờ đã lưu.

### 27. Giao hàng không phải thanh toán

`DELIVERY_CONFIRMED` chỉ là mốc tài xế xác nhận đã giao. Không có hóa đơn, không có trạng thái đã thu tiền, và không có bước tự chuyển sang `COMPLETED`. Nhãn `Hoàn tất` chưa được dùng vì điều kiện hoàn tất chưa được duyệt.
