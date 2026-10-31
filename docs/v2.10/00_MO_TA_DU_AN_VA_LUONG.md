# COLDI — Mô tả dự án và luồng nghiệp vụ

**Đọc file này trước** khi đọc các bản v2.4, v2.6, v2.7 hoặc từng file trong `docs/v2.10/`.

Ngày viết: 23/10/2026. Đây là bản giải thích cho người trong nhóm, mentor và người review. File này gom những gì đã chốt và những gì ứng dụng đang làm. File này không phải biên bản nghiệm thu và không phải bản production.

Ba từ dùng trong toàn bộ file:

| Từ | Nghĩa |
| --- | --- |
| **Đã chốt** | Product Owner đã duyệt hướng nghiệp vụ. Đây là luật đang dùng. |
| **Đang có trong ứng dụng** | Đã có mã để chạy thử. Có mã chưa có nghĩa đã nghiệm thu xong trên trình duyệt. |
| **Còn mở** | Chưa được duyệt. Không được tự đặt số, quyền hoặc bước tiếp theo. |

Khi một file cũ nói khác file này về giá, hoa hồng, sự cố hoặc giá dầu, dùng file này. Các file cũ được giữ để tra lịch sử, không bị viết đè.

## 1. Coldi là gì

Coldi là website vận tải lạnh cho doanh nghiệp.

Chủ hàng đăng một đơn chở hàng lạnh và ghi giá cước của chuyến đó. Nhà xe tự vào sàn, tự chọn đơn và tự bấm nhận. Sau khi nhận, nhà xe tự chọn xe và tài xế của mình. Tài xế được giao việc tự xác nhận đã lấy hàng, rồi tự xác nhận đã giao hàng.

Không có máy tự ghép đơn. Không có máy tự điều phối. Không có máy tự gán xe. Khách chưa đăng nhập chỉ xem trang công khai. Khách không phải một vai thứ năm.

Xác nhận giao hàng ghi nhận hàng đã được giao. Bước đó không thu tiền, không xuất hóa đơn và không kết sổ.

Ứng dụng hiện tại là website trên trình duyệt. Chưa có ứng dụng iOS, Android hay bộ cài máy tính riêng. Bản đang chạy là bản thử cho nhóm. Thanh toán production không hoạt động.

## 2. Bốn vai đang dùng

| Vai | Tên trên màn hình | Việc của vai này |
| --- | --- | --- |
| SHIPPER | Chủ hàng | Đăng đơn, xem đơn của mình, chat với nhà xe đã nhận đơn, đọc vị trí đơn mình tạo, xem dòng thời gian. |
| CARRIER | Nhà xe | Xem sàn, nhận chuyến, quản lý xe, tạo tài khoản tài xế, phân công, chat, đọc vị trí chuyến mình đã nhận. |
| DRIVER | Tài xế | Chỉ thấy chuyến nhà xe đã gán cho mình. Xác nhận lấy hàng, gửi vị trí khi đang chở, xác nhận giao hàng. |
| ADMIN | Quản trị | Đăng nhập được. Khu vận hành `/admin` chưa mở thành nơi làm việc hằng ngày. |

Một tài khoản một vai. Muốn đổi vai thì đăng xuất, rồi đăng nhập tài khoản kia. Không có nút đổi vai trong cùng một phiên.

Hai vai nằm trong hồ sơ mục tiêu nhưng chưa bật ở bản này:

- **WAREHOUSE** là tài khoản con của chủ hàng, dành cho giai đoạn sau, để duyệt hàng và đồng kiểm. Chưa có màn hình và chưa có quyền đăng nhập cho vai này. Điểm lấy hàng và điểm giao hàng trên đơn vẫn gọi là kho. Đó là địa điểm, không phải tài khoản.
- Tổ chức nhiều chi nhánh, nhiều thành viên trong một công ty, vẫn là việc sau. Gói dịch vụ hiện gắn vào từng tài khoản.

Tài xế là tài khoản do nhà xe tạo. Tài xế không mua gói và không tự vào sàn nhận chuyến.

## 3. Luồng chuyến hàng

Đây là luồng chính của sản phẩm.

### Bước người dùng thấy

1. Chủ hàng tạo đơn và đăng. Đơn sang **Đang tìm xe**. Trong dữ liệu, trạng thái là `PUBLISHED`.
2. Nhà xe mở sàn, chọn đơn phù hợp và bấm nhận. Đơn rời sàn tìm xe. Trạng thái là `MATCHED`, chữ trên màn hình là **Đã có nhà xe nhận chuyến** khi chưa gán đủ xe và tài xế.
3. Nhà xe chọn một xe đang dùng và một tài xế đang mở. Khi đã gán đủ, chữ trên màn hình là **Chờ lấy hàng**. Trạng thái dữ liệu vẫn là `MATCHED`. Nhà xe không bấm thay tài xế ở bước lấy hàng.
4. Tài xế xác nhận đã lấy hàng. Đơn sang **Đang vận chuyển**, trạng thái `IN_TRANSIT`. Tài xế gửi vị trí trong lúc chở.
5. Tài xế xác nhận đã giao. Đơn sang **Đã xác nhận giao hàng**, trạng thái `DELIVERY_CONFIRMED`. Dòng thời gian ghi rõ xác nhận giao chưa phải thanh toán.

GPS cho biết xe đang ở đâu. GPS không thay cho nút xác nhận lấy hàng hay giao hàng.

### Quy tắc đã chốt quanh luồng này

- Chủ hàng ghi **cước niêm yết** của chuyến, gọi là `listedPriceVnd`. Số này là tiền cước của chuyến. Số này không phải phí gói tháng, không phải phí hoa hồng, và không phải số tiền đã thu.
- Một xe chỉ được gắn một chuyến chưa xong. Chuyến chưa xong gồm các trạng thái còn mở trong dữ liệu: `DRAFT`, `MATCHED`, `PICKUP_CONFIRMED`, `IN_TRANSIT`, `INCIDENT`. Xe đã giao xong thì được nhận chuyến khác. Nếu hai lệnh gán cùng một xe, lệnh đến sau nhận lỗi xe đang bận.
- Dữ liệu còn vài mã trạng thái khác (`COMPLETED`, `CANCELLED`, `INCIDENT`, `DRAFT`). Luồng bấm thông thường ở trên không có nút hủy đơn, nút hoàn thành sổ và nút biến cả chuyến thành sự cố.
- Báo cáo sự cố là hồ sơ riêng. Tạo sự cố không tự đổi trạng thái chuyến, không tự dừng GPS và không tự hủy chuyến.

### Việc đã có mã và việc chưa nghiệm thu

Đăng đơn, sàn, nhận chuyến, phân công, lấy hàng, giao hàng, chat, GPS, đội xe và tài khoản tài xế đã có mã. Nghiệm thu desktop ngày viết v2.10 ghi một số bước cơ bản là đã đi được trên máy tính: tạo đơn, nhận chuyến, tạo xe và tài xế, phân công, tài xế nhận chuyến, chủ hàng xem phân công, đơn đã nhận biến khỏi sàn.

Chuỗi đầy đủ lấy hàng, rồi GPS, rồi giao hàng của ca QA-001 lúc đó **chưa được chạy lại**. Điện thoại và màn hình co giãn được để sau. Bản đồ Mapbox cần token thì mới hiện marker. Chat đã có bằng chứng nhìn thấy trên màn hình. Việc chat lưu dữ liệu lâu dài chưa được kết luận là nghiệm thu xong.

## 4. Gói dịch vụ

Gói là quyền dùng Coldi của một tài khoản chủ hàng hoặc nhà xe. Gói khác với số kiện hàng trên một đơn. Gói cũng khác với cước của một chuyến.

### Bảng giá đang công bố

Số dưới đây là giá đang nằm trong catalog của máy chủ, theo quyết định giá công khai đã duyệt sau v2.10 (`PKG-BIZ-01`). Trang khách xem là `/goi-dich-vu`. Chủ hàng xem gói của mình ở `/shipper/goi`. Nhà xe xem ở `/carrier/goi`.

| Ai | Gói | Giá niêm yết | Hoa hồng trên cước chuyến | Trần xe đang dùng |
| --- | --- | ---: | ---: | ---: |
| Chủ hàng | Free | 0 VND | 5% | Không có trần xe |
| Chủ hàng | Pro tháng | 799.000 VND/tháng | 4% | Không có trần xe |
| Chủ hàng | Pro năm | 7.990.000 VND/năm | 3,5% | Không có trần xe |
| Chủ hàng | Enterprise | 6.990.000 VND/tháng | 2,5% | Không có trần xe |
| Nhà xe | Free | 0 VND | 5% | 2 xe |
| Nhà xe | Pro tháng | 799.000 VND/tháng | 4% | 10 xe |
| Nhà xe | Pro năm | 9.990.000 VND/năm | 3,5% | 10 xe |
| Nhà xe | Business | 2.990.000 VND/tháng | 3% | 30 xe |
| Nhà xe | Enterprise | 7.990.000 VND/tháng | 2% | 100 xe |

Cách đọc bảng:

- Không có gói Enterprise theo năm.
- Không có số xe tối thiểu. Chỉ có trần xe đang dùng của nhà xe.
- Xe đã lưu trữ không tính vào trần.
- Chủ hàng không có hạn mức xe. Gói Enterprise của chủ hàng cũng không được cấp trần xe của nhà xe.
- Gói gắn với tài khoản. Tài xế không mua gói.
- Website không thu tiền gói. Kích hoạt gói trả phí chỉ xảy ra trong môi trường Demo hoặc QA khi máy chủ được cấp phép đủ cờ. Môi trường production từ chối đường kích hoạt đó. Một biến `NODE_ENV` không đủ để bật đường này.
- Gói đang dùng giữ giá, tỷ lệ hoa hồng, trần xe và kỳ hạn đã lưu trên gói đó. Một lần đổi catalog sau này không viết lại gói cũ.
- Bản v2.10 từng ghi Business và Enterprise là “báo giá” trong một khoảng tiền. Quyết định sau đó đã chốt các mức công khai ở bảng trên. Bảng giá nhà xe Pro tháng 999.000 VND trong file v2.7 là số cũ. Catalog đang dùng 799.000 VND/tháng.

### Khi gói hết hạn hoặc quá trần xe

Đã chốt và đã có trong mã gói:

- Gói trả phí hết hạn thì tài khoản về Free. Không có tự động trừ tiền để gia hạn.
- Nếu nhà xe đang có nhiều xe hoạt động hơn trần của gói hiện tại, trạng thái vận hành là quá hạn mức. Nhà xe không nhận thêm chuyến mới.
- Chuyến đã nhận vẫn được phân công, lấy hàng, gửi vị trí và giao hàng. Lịch sử và chat của chuyến đó vẫn đọc được.
- Hạ gói tự nguyện có hiệu lực ở cuối kỳ, không cắt ngay giữa kỳ.
- Chỉ lưu trữ xe khi xe không còn gắn chuyến chưa xong. Khôi phục xe hoặc thêm xe mới phải còn chỗ trong trần.

Còn mở: số đơn tối đa của chủ hàng, danh sách quyền lợi Premium, nâng gói giữa kỳ, cách tính tiền lẻ theo ngày, và điều khoản riêng từng hợp đồng ngoài bảng giá công khai.

## 5. Hoa hồng

Hoa hồng là phí dịch vụ Coldi tính trên cước niêm yết của từng chuyến. Hoa hồng không phải tiền thuê gói tháng.

### Luật đã chốt

Coldi tính **hai khoản riêng**:

- Phí của chủ hàng.
- Phí của nhà xe.

Cả hai dùng cùng một cước niêm yết. Không tính phí chồng lên nhau. Tỷ lệ lấy từ gói đang có hiệu lực tại đúng thời điểm khóa.

Tỷ lệ lưu bằng số nguyên basis point. 5% là 500. 4% là 400. 3,5% là 350. 3% là 300. 2,5% là 250. 2% là 200.

Mỗi bên được làm tròn riêng tới 1 VND theo kiểu half-up: phần lẻ từ 0,5 VND thì lên 1 VND. Cộng hai phí sau khi mỗi phí đã tròn. Không làm tròn một lần trên tổng.

Ví dụ, cước niêm yết 10.000.000 VND. Chủ hàng đang Pro tháng nên phí chủ hàng là 400.000 VND. Nhà xe đang Free nên phí nhà xe là 500.000 VND. Tổng ước tính của nền tảng là 900.000 VND. Con số đó là ước tính trên sổ. Coldi không thu 900.000 VND đó trong bản này.

Thời điểm khóa:

- Khóa tỷ lệ chủ hàng khi đăng đơn thành công.
- Khóa tỷ lệ nhà xe khi nhà xe nhận chuyến thành công.
- Đổi gói sau đó không sửa hai tỷ lệ đã khóa của chuyến cũ.

Trạng thái sổ, từng bên một:

1. Có bản khóa thì phí ở mức **ước tính**.
2. Chỉ khi giao hàng được xác nhận thì phí sang **đã ghi nhận**.
3. Không có bước tự động sang **đã thu**.
4. Hủy hợp lệ trước khi giao thì phần ước tính đang có được **hủy trên sổ**.
5. Sau khi giao, có thể tạm giữ từng bên khi đã được phép. Sửa số là một dòng mới. Dòng gốc không bị viết lại.
6. Sự cố không tự tạm giữ hoa hồng và không tự xóa phí.

Màn hình phải nói rõ đây là mô phỏng Demo/QA và số đang xem chưa phải tiền đã thu. Tài xế không sửa sổ hoa hồng.

### Trong ứng dụng bây giờ

Đã có mã mô phỏng: khóa tỷ lệ lúc đăng hoặc lúc nhận chuyến, ghi sổ từ ước tính sang đã ghi nhận khi giao hàng, và cho chủ đơn hoặc nhà xe đã nhận đọc sổ của mình.

Chưa làm, vì điều kiện còn mở hoặc vì chưa có luồng hủy đơn được duyệt:

- Hủy phí khi hủy chuyến.
- Tạm giữ, gỡ giữ và điều chỉnh qua cổng HTTP.
- Thu tiền, chi trả, hoàn tiền, hóa đơn và trạng thái đã thu.

Còn mở: hủy được ở giai đoạn nào của chuyến, ai được tạm giữ hoặc điều chỉnh, ngưỡng tiền cần duyệt, và cách xử lý tranh chấp.

## 6. Báo cáo sự cố

Sự cố là một hồ sơ riêng của chuyến. Sự cố không viết đè vòng đời chuyến.

### Luật đã chốt

Ai được báo:

- Chủ hàng báo trên đơn của mình.
- Nhà xe báo trên đơn nhà xe đó đã nhận.
- Tài xế chỉ báo trên chuyến đang được gán cho mình.

Nhà xe phản hồi tuyến đầu. Quản trị được chỉ định xử lý khi sự cố được chuyển cấp. Người xem chỉ thấy hồ sơ mình có quyền. Máy người dùng không được tự khai vai người báo.

Trạng thái chính đã chốt:

`Mới mở → Đã tiếp nhận → Đang xử lý → Đã có kết quả → Đã đóng`

Phản đối đưa hồ sơ từ **Đã có kết quả** về **Đang xử lý** và có lịch sử. Có kết quả chưa phải đã đóng. Chuyển cấp là một chiều riêng, không ghi đè trạng thái chính.

Sáu loại: nhiệt độ, phương tiện, chậm trễ, hàng hóa, lấy hoặc giao hàng, và loại khác. Form chữ là đủ. Ảnh là tùy chọn. File không phải ảnh và cảm biến gắn xe nằm sau bản này.

Có thông báo trong ứng dụng. Có mức ưu tiên và nhắc việc nội bộ khi được cấu hình. Không hứa thời gian phản hồi cứng và không hứa trực 24/7.

### Trong ứng dụng bây giờ

Đã có bản kỹ thuật để thử: tạo báo cáo chữ, phân quyền, đi từ mở đến có kết quả, phản đối, lịch sử và thông báo trong ứng dụng. Giao diện sự cố chưa được nghiệm thu.

Một số cửa trong mã đang khóa vì phần đó còn mở hoặc chỉ là chặn an toàn:

- Chuyển cấp và đặt mức ưu tiên qua HTTP đang bị từ chối.
- Đóng hồ sơ và mở lại đang có một lối hẹp cho loại sự cố phương tiện. Các loại khác bị từ chối. Quyền đóng và mở lại nói chung vẫn chưa được duyệt thành luật đầy đủ.
- Cửa sổ được phép tạo báo cáo đang chặn một số trạng thái chuyến. Đó là chặn an toàn trong mã, chưa phải luật cửa sổ đã duyệt.
- Dung lượng ảnh sự cố, ngưỡng ưu tiên, chu kỳ nhắc và người phân loại đơn chưa có nhà xe vẫn còn mở.

## 7. Giá dầu và giá diesel

Hai việc này đứng cạnh nhau trên màn hình, nhưng là hai nguồn số khác nhau.

### Giá dầu thô thế giới — đã chốt

Chỉ hiện giá dầu thô mới nhất của Brent và WTI.

- Đơn vị là USD/thùng.
- Mỗi số đi kèm tên chuẩn dầu, giá, ngày quan sát của nguồn, thời điểm hệ thống lấy, nhà cung cấp và địa chỉ nguồn.
- Nguồn ưu tiên là nguồn kiểm chứng được, ví dụ EIA.
- Đây không phải giá từng phút. Không đổi sang VND/lít. Không dùng giá dầu bán lẻ Việt Nam.
- Số này không đổi cước chuyến, giá gói, hoa hồng hay lượng nhiên liệu của một xe.
- Máy chủ lấy dữ liệu vài lần trong ngày. Nếu nguồn lỗi, các việc đăng nhập, đăng đơn, nhận chuyến, chat, GPS, lấy hàng và giao hàng vẫn chạy.
- Khi dữ liệu đã cũ theo quy tắc đã duyệt, giữ giá hợp lệ cuối cùng và nói rõ tình trạng. Khi chưa có giá, báo không có số. Không điền số 0.

Còn mở: giờ chạy cụ thể trong ngày, lịch phát hành của nguồn và giấy phép API. Chưa được tự đổi sang nhà cung cấp khác.

Trong ứng dụng đã có đường đọc Brent và WTI. Lần kiểm tra nguồn EIA ngày 18/10/2026 không có khóa API hợp lệ, nên chưa đối chiếu được một dòng giá thật. Bài kiểm tra tự động dùng nguồn giả lập.

### Diesel Việt Nam — việc thêm sau

Khối “Thị trường nhiên liệu” trên trang chủ có thêm giá trần diesel trong nước, đơn vị VND/lít, nếu một quản trị viên đã công bố một bản ghi đã kiểm chứng từ trang của Bộ Công Thương. Khi chưa có bản ghi đó, trang báo chưa có dữ liệu diesel được xác minh.

Giá này là giá trần công bố khi có đủ nguồn. Đây không phải giá tại cây xăng. Số này không đổi cước, gói, thù lao tài xế hay hoa hồng.

Tài xế không bắt buộc có widget dầu trên trang chủ tài xế trong bản đã chốt. Bản giao diện sau đó đặt mục thị trường nhiên liệu ở thanh bên của nhà xe và của tài xế, dạng chỉ đọc.

## 8. Vài quy tắc màn hình đã chốt

| Mã | Đã chốt | Trong ứng dụng bây giờ |
| --- | --- | --- |
| CHAT-01 | Chủ hàng được mở chat với nhà xe ngay sau khi đơn đã được nhận. Không cần đợi nhà xe mở trước. | Đã có đường mở hội thoại. Nếu chưa có nhà xe nhận, máy chủ từ chối. |
| FORM-01 | Lỗi nhập hiện ngay dưới trường sai, có viền lỗi và được đưa con trỏ vào. Hết lỗi thì dòng lỗi biến mất. Áp dụng cho tạo đơn, thêm xe và tạo tài xế. | Đã chốt. File này không ghi từng form đã được nghiệm thu. |
| IMG-01 | Đơn mới cần từ 1 đến 5 ảnh hàng hóa, ở bước tạo đơn. Có xem trước và xóa. Nhà xe thấy ảnh. Đơn cũ thiếu ảnh vẫn mở được. | Form tạo đơn đang bắt 1–5 ảnh. Định dạng JPG, PNG, WebP và mức 2 MB mỗi ảnh là giới hạn kỹ thuật tạm. Giới hạn đó chưa được duyệt thành luật. |
| DRIVER-04 | Nhà xe tạo tên đăng nhập và mật khẩu cho tài xế. Không bắt email. Lần đăng nhập đầu không bắt đổi mật khẩu. Tài xế vẫn tự đổi mật khẩu khi muốn. Mật khẩu lưu dạng đã băm. Tài khoản cũ đang dùng email vẫn đăng nhập trong thời gian chuyển. | Tài khoản tài xế mới đi theo hướng này: tên đăng nhập, không bắt email, không bật cờ đổi mật khẩu lần đầu. |
| TEXT-01 | Dòng thời gian không lặp chữ “Xe Xe” hoặc “Tài xế Tài xế”. | Mã ghép câu đã bỏ tiền tố khi tên sẵn có chữ đó. Chưa có biên bản nghiệm thu riêng. |
| UX-04 | Có đề xuất thêm tổng chuyến đang chở và tổng chuyến đã giao trên trang nhà xe. | Chưa được duyệt để làm. Không coi là việc đã chốt. |

## 9. Những việc Coldi chưa làm

Những việc này nằm ngoài bản đang chạy, dù có người hỏi:

- Cổng thanh toán, trừ tiền gói, thu hoa hồng, chi trả, hoàn tiền, hóa đơn VAT.
- Tự ghép đơn, tự điều phối, tự gán xe.
- Vai kho, nhiều chi nhánh, nhiều người trong một tổ chức.
- Cảm biến nhiệt độ trên xe, sổ đổ dầu, định mức nhiên liệu theo xe.
- Đổi giá cước theo giá dầu.
- Ứng dụng điện thoại riêng.
- Khu quản trị vận hành đầy đủ.

## 10. Nên đọc tiếp file nào

Đọc theo việc cần làm.

| Việc cần | File |
| --- | --- |
| Cài và chạy máy | [TEAM_TESTING_GUIDE](../team-testing/TEAM_TESTING_GUIDE.md) |
| Bấm từng màn hình theo vai | [USER_GUIDE_BEGINNERS](../team-testing/USER_GUIDE_BEGINNERS.md) |
| Sổ quyết định ngày 18/10/2026 | [01_DECISION_REGISTER](01_DECISION_REGISTER.md) |
| Giá công khai Business và Enterprise | [PKG_BIZ_01_APPROVED_POLICY](../uat/PKG_BIZ_01_APPROVED_POLICY.md) |
| Chi tiết mã hoa hồng | [Handoff hoa hồng](../commission/MVP_HANDOFF.md) |
| Chi tiết mã sự cố | [Handoff sự cố](../incident/MVP_HANDOFF.md) |
| Chi tiết mã giá dầu và diesel | [Handoff dầu](../oil/MVP_HANDOFF.md), [Handoff nhiên liệu](../fuel/MVP_HANDOFF.md) |
| Bản đồ cả thư mục tài liệu | [docs/README](../README.md) |

`Coldi_MasterConst_v2.4.docx` vẫn là hồ sơ quyết định vai trò cũ. File Word đó không được sửa thành v2.10. Quyết định vai trò D-18 đến D-23 trong hồ sơ đó vẫn đúng với phần vai: bốn vai đang bật, kho để sau, tài xế là tài khoản con của nhà xe. Giá, gói, hoa hồng, sự cố và dầu thì dùng file này.

## 11. Chỗ dễ đọc nhầm

- Bộ `docs/v2.7/` và `docs/v2.6/` là quyết định và bản thảo của các ngày trước. Trang đầu của chúng đã được gắn dòng dẫn về bản hiện hành. Phần thân vẫn giữ câu chữ của ngày đó, kể cả câu “chưa có mã”.
- Sổ v2.10 ghi hoa hồng, sự cố và giá dầu là chưa có mã vì đó là sự thật lúc ngày 18/10/2026. Sau ngày đó đã có mã mô phỏng và mã kỹ thuật. Trạng thái mới nằm ở các handoff và ở file này.
- `docs/COLDI_DEMO_GUIDE.md` mô tả giao diện từ lúc chưa có máy chủ. Không dùng file đó để cài hoặc để demo hôm nay.
- `docs/product/README.md` trước đây trỏ chính sách hiện hành về v2.7. Cổng vào đúng bây giờ là file này.
