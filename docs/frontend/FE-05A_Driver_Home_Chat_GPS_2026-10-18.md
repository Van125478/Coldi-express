# FE-05A — Trang chủ tài xế, hộp thoại, GPS nhà xe

Ngày: 18/10/2026. Nhánh: `integration/coldi-v2.3-mvp`. HEAD lúc bắt đầu: `fe1e9207dc1f27cf735876205afde204b967c3fb`.

Chủ dự án đã duyệt ba việc này. Bố cục trang chủ tài xế đã được review và chấp nhận. Hộp thoại và khối GPS đã được xem trên trình duyệt ở trạng thái không ghi nghiệp vụ. Các màn FE-05A còn lại chưa visual accepted. FE-05B chưa bắt đầu. Tile Mapbox và chuỗi E2E chưa pass.

## Trang chủ tài xế

Ba số đếm nằm trên một hàng theo bề ngang nội dung. Chuyến cần làm nằm dưới, là khối chính. Nếu còn chuyến thật đang chờ lấy hoặc đang giao, tối đa ba chuyến hiện ở cột “Chuyến cần làm khác”. Chỉ một chuyến thì thẻ chính trải ra. Không thêm đơn. Không đổi cách tính số hay đường dẫn lọc.

## Hộp thoại

Khung chat của chủ hàng và nhà xe có đầu cuộc trò chuyện, vùng tin cuộn, và ô nhập gắn nút gửi. Tin của mình nằm bên phải, nền navy. Tin đối tác nằm bên trái. Enter gửi. Shift+Enter xuống dòng. Soạn thảo IME không gửi nhầm. Gửi lỗi giữ bản nháp. API chat, quyền đọc thread và việc chat không nhận chuyến không đổi.

## GPS

`GET /api/carrier/shipments/:id/location` chỉ trả vị trí khi phiên là CARRIER và `carrierId` của đơn trùng người đang đăng nhập. Chủ hàng vẫn dùng API cũ của đơn mình. Tài xế vẫn chỉ gửi khi đang vận chuyển. Quản trị và khách không được xem. Sàn và DTO marketplace không kèm tọa độ. “Bản đồ lộ trình” trên chi tiết nhà xe vẫn là chỗ điểm lấy/điểm giao chưa có tọa độ, tách khỏi “Theo dõi vị trí xe”.

Chưa nghiệm thu tile Mapbox. Chưa ghi điểm GPS mới vào database phát triển trong lượt này.
