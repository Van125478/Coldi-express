# COLDI

COLDI là website vận tải lạnh B2B. Chủ hàng đăng đơn. Nhà xe tự nhận chuyến rồi phân công xe và tài xế. Tài xế được phân công xác nhận lấy hàng, sau đó mới xác nhận giao hàng. Xác nhận giao hàng không phải thanh toán.

Bản này là **WIP / Team Testing**. Không phải bản production. MVP v2.4 chưa hoàn thành và chưa được nghiệm thu đầu-cuối.

## Bắt đầu tại đây

Người mới clone GitHub rồi dùng nhánh `main`.

Đọc và làm theo [hướng dẫn kiểm thử](docs/team-testing/TEAM_TESTING_GUIDE.md).

```bash
git clone https://github.com/Van125478/Coldi-express.git
cd Coldi-express
git checkout main
git pull
git rev-parse HEAD
```

Ghi SHA vừa in vào mỗi báo lỗi. Đừng dùng một SHA cũ trong tài liệu lịch sử làm HEAD hiện hành.

Cần Node.js `>= 20.19.0` và npm đi kèm. Vite 8 cần `^20.19.0` hoặc `>= 22.12.0`. Không có `package.json` ở thư mục gốc. Bản clone sạch nên dùng `npm ci` trong `server/` và trong `web/`.

API: `http://127.0.0.1:4000`. Web: `http://127.0.0.1:5173`. Dùng đúng `127.0.0.1`, không dùng `localhost`.

## Vai trò MVP

| Vai trò | Việc đang có trong mã |
| --- | --- |
| SHIPPER | Đăng đơn, xem đơn của mình, chat, đọc GPS đơn mình tạo, xem timeline |
| CARRIER | Sàn, nhận chuyến, phân công, đội xe, cấp tài khoản tài xế, chat, đọc GPS chuyến mình đã nhận |
| DRIVER | Trang chủ, chuyến được gán, xác nhận lấy và giao, gửi GPS khi đang vận chuyển, đổi mật khẩu khi bị yêu cầu |
| ADMIN | Đăng nhập đúng vai. Trang `/admin` báo khu vận hành chưa mở |

WAREHOUSE không phải vai MVP. Đăng ký công khai chưa tạo tài khoản.

## Có trong mã, chưa phải đã nghiệm thu

Có mã và test API cho luồng logistics: đăng, nhận, phân công, lấy, giao, chat, GPS, đội xe và tài khoản tài xế. Trang chủ tài xế kiểu nhiệm vụ đã được xem bố cục. Hộp thoại chủ hàng và nhà xe đã được xem trên trình duyệt ở trạng thái không ghi dữ liệu.

Chưa có:

- Nghiệm thu tay toàn chuỗi đăng → nhận → phân công → lấy → GPS thật → giao.
- Tile và marker Mapbox đã chứng minh. Không có token thì tọa độ vẫn hiện, bản đồ không vẽ.
- Package Management. Phương án B đã chốt rằng MVP cuối cùng sẽ có gói, quyền gói và hạn mức, nhưng phần đó chưa được triển khai. Thanh toán online nằm sau MVP.
- FE-05B.
- Xác nhận hoàn thành MVP.

Trạng thái đối chiếu nằm ở [MVP_STATUS_2026-10-18.md](docs/mvp-review/MVP_STATUS_2026-10-18.md). Quyết định sản phẩm nằm ở [COLDI_v2.4_Product_Decisions_2026-10-17.md](docs/product/COLDI_v2.4_Product_Decisions_2026-10-17.md).

## Lịch sử, không phải hướng dẫn cài đặt

Các mục dưới đây ghi thời điểm viết báo cáo cũ. Đừng checkout `feature/cinematic-scroll` để chạy bản team testing.

Tài liệu Core 08 lúc đầu mô tả máy local trước khi GPS, chat, đội xe và sàn lọc nằm trên `main`. `feature/cinematic-scroll` từng dừng ở `69ec1a198f0729efc10a3d534dd92d264b1738eb`. Core 07 timeline từng là `cd5045300ac4c788deba3c08053ed1a439481d95`. Một README cũ còn bảo người mới checkout `integration/coldi-v2.3-mvp` và còn trích `origin/main` lúc chỉ là commit khởi tạo `44e4791134690c72a261d91c60388994668fcdcb`. Những câu đó không còn là cách lấy mã.

`docs/core-08/` giữ biên bản và cách xử lý sự cố của đợt đó. Người mới làm theo Team Testing Guide. `docs/COLDI_DEMO_GUIDE.md` là mô tả giao diện cũ, không dùng để cài đặt. `docs/mvp-review/` trước ngày 18/10/2026 là ảnh chụp lịch sử; đọc banner trên từng file và bản trạng thái mới.
