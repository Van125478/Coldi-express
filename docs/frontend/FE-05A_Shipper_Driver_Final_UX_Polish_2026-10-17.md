# FE-05A — Shipper và Driver, chỉnh UX cuối

Ngày: 17/10/2026. Nhánh: `integration/coldi-v2.3-mvp`. HEAD lúc bắt đầu: `c4772f6e8e4f7beaa9625420cedd07bf518980bc`.

Bố cục trang chủ tài xế sau ngày này nằm ở [FE-05A_Driver_Home_Chat_GPS_2026-10-18.md](FE-05A_Driver_Home_Chat_GPS_2026-10-18.md). Các số đo trong file này là của lượt 17/10.

Đây là chỉnh câu chữ và bố cục đã được chỉ ra. Không phải tính năng mới. Chưa có nghiệm thu hình ảnh từ chủ dự án. FE-05B chưa bắt đầu.

## Việc đã sửa

- Trang chủ chủ hàng chỉ còn một nút tạo đơn trong nội dung khi đã có đơn. Menu trái vẫn có Tạo đơn và Quản lý đơn. Trạng thái trống vẫn giữ nút Đăng đơn hàng.
- Chi tiết đơn chủ hàng bỏ dòng `Trạng thái lưu` và mã trạng thái thô. Huy hiệu tiếng Việt giữ nguyên. Mã đơn hiện với nhãn "Mã đơn".
- Khối vị trí bỏ đoạn giải thích Mapbox, ETA, tuyến và cơ chế xác nhận. Câu chữ theo đúng pha API.
- Lịch sử sự kiện bỏ `max-h-96` và thanh cuộn lồng. Mốc cũ có một câu nguồn gốc, phần giải thích dài nằm trong mục thu gọn.
- Trang chủ tài xế dùng tiêu đề "Tổng quan tài xế". Email là dòng phụ. Ba số đếm nằm ngang, thẻ chuyến hiện tại không bị kéo giãn quá 36rem.
- Hộp xác nhận tài xế dùng câu ngắn. Xác nhận giao không bị gọi là thanh toán. Không đổi payload hay thứ tự xác nhận.

## Câu chữ

| Chỗ | Trước | Sau |
| --- | --- | --- |
| Chủ hàng, mô tả trang | Niêm yết đơn lạnh, theo dõi nhà xe đã nhận và xem vị trí khi tài xế đã bắt đầu chuyến. | Theo dõi đơn đang tìm xe, đã có nhà xe nhận và đang giao. |
| Chủ hàng, trạng thái thô | Trạng thái lưu: DELIVERY_CONFIRMED. Mã đơn … | Mã đơn … |
| Vị trí, không có điểm | Chưa nhận được vị trí GPS. kèm đoạn dài | Chưa có vị trí xe được cập nhật. |
| Vị trí, đã giao, không có điểm | Không có vị trí nào được ghi trước khi dừng theo dõi. | Theo dõi trực tiếp đã kết thúc. Chưa có vị trí xe được cập nhật. |
| Vị trí, thiếu bản đồ | Chưa có khóa bản đồ Mapbox công khai. | Bản đồ chưa được cấu hình. Tọa độ vẫn hiện ở trên. |
| Tài xế, tiêu đề | Email tài khoản | Tổng quan tài xế |
| Xác nhận lấy | Chuyến chuyển sang Đang vận chuyển… không lấy từ GPS. | Xác nhận rằng bạn đã nhận hàng và bắt đầu vận chuyển. |
| Xác nhận giao | Trạng thái thành Đã xác nhận giao hàng… GPS không tự xác nhận giao. | Xác nhận rằng hàng đã được giao đến điểm nhận. Việc này chưa phải thanh toán. |

## File

- `web/src/features/workspace/shipper/ShipperDashboard.tsx`
- `web/src/features/workspace/shipper/ShipperShipmentDetail.tsx`
- `web/src/features/workspace/gps/ShipmentLocation.tsx`
- `web/src/features/workspace/gps/types.ts`
- `web/src/features/workspace/gps/DriverLocationShare.tsx`
- `web/src/features/workspace/ShipmentTimeline.tsx`
- `web/src/features/workspace/driver/DriverHome.tsx`
- `web/src/features/workspace/driver/DriverTripDetail.tsx`

Không sửa API, schema, seed, Carrier Home, Marketplace, Fleet, Login hay trang khách.

## Trình duyệt

Đã xem trên `http://127.0.0.1:5173` với dữ liệu demo đang có. Không tạo đơn, không nhận chuyến, không xác nhận lấy hoặc giao.

- 1440 và 1280: trang chủ chủ hàng còn một nút Đăng đơn hàng. Không tràn ngang.
- 1440: đơn đã giao hiện huy hiệu "Đã xác nhận giao hàng" và mã đơn. Không thấy `DELIVERY_CONFIRMED`.
- 1440: đơn đã giao không có tọa độ. Khối vị trí hiện "Theo dõi trực tiếp đã kết thúc." và "Chưa có vị trí xe được cập nhật."
- 1440: lịch sử năm mốc của đơn đó nằm trong luồng trang. `overflow-y` là `visible`, không có thanh cuộn lồng.
- 1440 và 1280: trang chủ tài xế. Số đếm thật là 3 chờ lấy, 0 đang vận chuyển, 3 đã giao. Các số vẫn dẫn tới bộ lọc cũ. Thẻ chuyến rộng 576px.
- 1440: chi tiết chuyến tài xế. Mở hộp xác nhận lấy rồi bấm Hủy. Không ghi nhận. Câu xác nhận lấy đúng như bảng trên.
- 1440: lịch sử chuyến tài xế cũ hiện một câu nguồn gốc và mục "Vì sao không đủ mốc" đang đóng. Không suy diễn mốc nhận chuyến.
- 1280: nút xác nhận lấy nằm trọn trong khung, không tràn ngang.
- 1440: chi tiết nhà xe cùng đơn năm mốc. Lịch sử dùng chung vẫn đủ năm mốc, không thanh cuộn lồng, không mã trạng thái thô. Không chỉnh bố cục nhà xe.

## Kiểm tra tự động

Trong `web/`: `npm run lint`, `npx tsc -b`, `npm run build` đều thoát 0. Cảnh báo bundle lớn vẫn còn từ trước.

Không đổi logic backend. Không chạy lại bộ 69 test server. Baseline đó vẫn là lần chạy trước trên mã server hiện tại.

## Chưa kiểm chứng trên trình duyệt

Tài khoản demo không có tọa độ GPS nào. Chưa thấy pha đang vận chuyển có tọa độ, vị trí cũ, vị trí cuối còn tọa độ, hoặc bản đồ khi đã cấu hình. Không bịa điểm để chụp.

Chưa mở hộp xác nhận giao vì không bấm xác nhận lên đơn đang lưu. Câu chữ giao nằm trong code.

Trang chủ chủ hàng lúc không có đơn chưa được chụp vì tài khoản demo đang có đơn.

## Còn lại

Chi tiết mốc phân công vẫn có thể hiện "Xe Xe …" khi tên xe đã bắt đầu bằng "Xe". Chuỗi đó đến từ API, chưa sửa trong lượt này.

Chưa nghiệm thu hình ảnh. FE-05B chưa bắt đầu.
