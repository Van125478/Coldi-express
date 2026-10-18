# Fuel market — diesel + world oil

Brent/WTI đã có trên `main` từ PR #11. Đợt này chỉ thêm diesel Việt Nam và bố trí lại giao diện.

## Vietnam diesel

Không có JSON API chính thức từ Bộ Công Thương hoặc [Minh bạch xăng dầu](https://minhbach.moit.gov.vn/).

Văn bản điều hành mới nhất đã thấy trên `moit.gov.vn`: **8480/BCT-TTTN ngày 15/10/2026**. Nội dung giá trần không đọc được từ trang công khai (cổng văn bản yêu cầu đăng nhập). Công văn 8177/BCT-TTTN ngày 08/10/2026 có diesel 0.05S không cao hơn 29.128 đồng/lít, nhưng đã bị kỳ 15/10 thay thế nên **không được hiển thị như giá hiện hành**.

Giá bán lẻ của thương nhân (ví dụ Petimex) không phải giá trần nhà nước.

COLDI không đoán số. Public API trả `Chưa có dữ liệu diesel được xác minh` cho đến khi một Admin đăng nhập công bố bản ghi đã xác minh (`POST /api/market/fuel/diesel`). Nguồn chỉ chấp nhận `https` trên `moit.gov.vn` hoặc `minhbach.moit.gov.vn`. Mỗi lần công bố mới đánh dấu bản cũ `superseded`.

Đây là giá trần công bố nếu có, đơn vị VND/lít, không phải giá bơm lẻ. Không đổi cước, gói, thù lao tài xế hoặc hoa hồng.

## World oil

`GET /api/market/oil-prices` giữ nguyên. Widget Brent/WTI được nhúng trong cùng khối thị trường nhiên liệu.

## UI

- Landing: một khối "Thị trường nhiên liệu".
- Shipper Home: khối đó nằm ngay dưới tiêu đề, trước danh sách đơn.
- Carrier và Driver: mục sidebar riêng, trang chỉ đọc. Carrier Home không còn widget dầu lớn.
