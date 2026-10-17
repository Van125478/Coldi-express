# COLDI

COLDI là website vận tải lạnh cho doanh nghiệp. Chủ hàng đăng đơn. Nhà xe tự nhận chuyến rồi phân công xe và tài xế. Tài xế được phân công xác nhận lấy hàng, sau đó xác nhận giao hàng. Xác nhận giao không phải thanh toán.

Bản này là **WIP / Team Testing**. Không phải bản production. MVP theo phương án B chưa hoàn thành.

## Người mới đọc theo thứ tự này

1. [Cài đặt và chạy máy](docs/team-testing/TEAM_TESTING_GUIDE.md) — Git, Node.js, MongoDB, file cấu hình, mở website.
2. [Cách dùng từng vai trò](docs/team-testing/USER_GUIDE_BEGINNERS.md) — chủ hàng, nhà xe, tài xế, chat, GPS, kịch bản thử từ đầu đến cuối.
3. [Khi gặp lỗi](docs/team-testing/TROUBLESHOOTING.md) — triệu chứng, cách kiểm tra, cách xử lý an toàn.
4. [Trạng thái MVP 18/10/2026](docs/mvp-review/MVP_STATUS_2026-10-18.md) — phần nào đã có mã, phần nào chưa nghiệm thu, phần nào chưa làm.

Chi tiết API nằm ở [server/README.md](server/README.md). Biến môi trường kỹ thuật của đợt Core 08 nằm ở [docs/core-08/01-thiet-lap.md](docs/core-08/01-thiet-lap.md). File Core 08 là hồ sơ kỹ thuật, không thay hướng dẫn cài đặt ở trên.

## Lấy mã trên Windows

Mở PowerShell. Mỗi lệnh một dòng. `main` là nhánh người thử dùng **sau khi chủ dự án đã merge pull request**. Trước lúc đó, đừng coi `main` là bản có đủ tài liệu mới.

```powershell
git clone https://github.com/Van125478/Coldi-express.git
cd Coldi-express
git checkout main
git pull --ff-only
git branch --show-current
git rev-parse HEAD
```

`git branch --show-current` phải in `main`. `git rev-parse HEAD` in mã commit. Ghi mã đó vào mỗi báo lỗi. Đừng chép một mã cũ trong tài liệu lịch sử.

Cần Node.js `>= 20.19.0`. Vite 8 trong `web/` cần `^20.19.0` hoặc `>= 22.12.0`. Không có `package.json` ở thư mục gốc.

## Bốn vai trong mã

| Mã vai | Tên trên màn hình | Việc đang có mã |
| --- | --- | --- |
| SHIPPER | Chủ hàng | Đăng đơn, xem đơn của mình, chat, đọc GPS đơn mình tạo, xem timeline |
| CARRIER | Nhà xe | Sàn, nhận chuyến, phân công, đội xe, cấp tài khoản tài xế, chat, đọc GPS chuyến mình đã nhận |
| DRIVER | Tài xế | Trang chủ, chuyến được gán, xác nhận lấy và giao, gửi GPS khi đang vận chuyển |
| ADMIN | Quản trị | Đăng nhập. Trang `/admin` báo khu vận hành chưa mở |

Khách mở trang công khai không phải một vai nghiệp vụ. Không có nút đổi vai trong một phiên đăng nhập.

## Có mã, chưa phải đã xong MVP

Đã có mã logistics: đăng, nhận, phân công, lấy, giao, chat, GPS, đội xe, tài khoản tài xế. Bố cục trang chủ tài xế đã được chấp nhận. Các màn còn lại chưa được chấp nhận hình ảnh. Chuỗi bấm từ đăng đơn đến giao hàng chưa được ghi là PASS. Tile Mapbox chưa được chứng minh.

Phương án B đã chốt: MVP cuối cùng còn bắt buộc Package Management, quyền gói và hạn mức trên backend. Phần đó chưa triển khai. Thanh toán online nằm sau MVP. Không có tên gói, giá gói hay hạn mức trong bản này.

FE-05B chưa bắt đầu.

## Lịch sử, không phải cách cài hôm nay

Đừng checkout `feature/cinematic-scroll`. Đừng checkout `integration/coldi-v2.3-mvp` để thử bản nhóm, trừ khi bạn đang review pull request trước khi merge.

Một tài liệu cũ từng nói `main` chỉ có commit khởi tạo `44e4791134690c72a261d91c60388994668fcdcb`. Câu đó đúng vào ngày viết, không còn là hướng dẫn. `docs/mvp-review/` trước file trạng thái 18/10/2026 là ảnh chụp lịch sử. `docs/COLDI_DEMO_GUIDE.md` mô tả giao diện cũ, không dùng để cài đặt.
