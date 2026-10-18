# COLDI

COLDI là website vận tải lạnh cho doanh nghiệp. Chủ hàng đăng đơn. Nhà xe tự nhận chuyến rồi phân công xe và tài xế. Tài xế được phân công xác nhận lấy hàng, sau đó xác nhận giao hàng. Xác nhận giao không phải thanh toán.

**Tài liệu sản phẩm hiện hành là v2.6.** Code trên nhánh này là **WIP / Team Testing**. Đây không phải bản phát hành ứng dụng v2.6 và không phải bản production. MVP chưa hoàn thành.

## Người mới đọc theo thứ tự này

1. [Cài đặt và chạy máy](docs/team-testing/TEAM_TESTING_GUIDE.md) — Git, Node.js, MongoDB, file cấu hình, mở website.
2. [Cách dùng từng vai trò](docs/team-testing/USER_GUIDE_BEGINNERS.md) — chủ hàng, nhà xe, tài xế, chat, GPS, kịch bản thử từ đầu đến cuối.
3. [Khi gặp lỗi](docs/team-testing/TROUBLESHOOTING.md) — triệu chứng, cách kiểm tra, cách xử lý an toàn.
4. [Tài liệu sản phẩm v2.6](docs/v2.6/README.md) — phạm vi đặc tả hiện hành. Giá gói và công thức hoa hồng trong bộ này là đề xuất cho tới khi được duyệt.
5. [Trạng thái MVP 18/10/2026](docs/mvp-review/MVP_STATUS_2026-10-18.md) — ảnh chụp phần nào đã có mã tại baseline trước bộ v2.6. Không thay phạm vi v2.6.

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

## Tài liệu sản phẩm v2.6

CURRENT v2.6 PRODUCT SCOPE. Bộ này là đặc tả, không phải bằng chứng code đã có các module mới. Bản đồ cả thư mục tài liệu: [docs/README.md](docs/README.md).

- [Mục lục v2.6](docs/v2.6/README.md)
- [Phạm vi MVP](docs/v2.6/product/01_MVP_SCOPE_v2.6.md)
- [Bảng giá gói](docs/v2.6/product/02_PRICING_PACKAGES_v2.6.md)
- [Hoa hồng hai phía](docs/v2.6/product/03_COMMISSION_POLICY_v2.6.md)
- [Luồng gói](docs/v2.6/product/04_PACKAGE_WORKFLOWS_v2.6.md)
- [Giá dầu thô thế giới](docs/v2.6/product/05_WORLD_OIL_PRICE_v2.6.md)
- [Báo cáo sự cố](docs/v2.6/product/06_INCIDENT_REPORTING_v2.6.md)
- [Quyết định còn mở](docs/v2.6/product/07_OPEN_DECISIONS_v2.6.md)
- [Kế hoạch nghiệm thu](docs/v2.6/qa/02_ACCEPTANCE_PLAN_v2.6.md)
- [Backlog triển khai](docs/v2.6/qa/03_MVP_IMPLEMENTATION_BACKLOG_v2.6.md)
- Cài đặt người mới: [TEAM_TESTING_GUIDE](docs/team-testing/TEAM_TESTING_GUIDE.md)

## Có mã, chưa phải đã xong MVP

CURRENT IMPLEMENTED CODE trên baseline `7d07e941ace1d3490996c53a6bed36478a6d4836`: đăng đơn, sàn, nhận chuyến, phân công, lấy hàng, giao hàng, chat, GPS, đội xe, tài khoản tài xế. Product Owner đã review và chấp nhận bố cục của Carrier Home, phần phân công chuyến của Nhà xe, Driver Home và cấu trúc Shipper/Carrier Chatbox. Đây là nghiệm thu bố cục trực quan, không phải nghiệm thu toàn bộ chức năng. Luồng E2E vận tải, chat lưu dữ liệu thực và Mapbox tiles/marker vẫn chưa được xác minh đầy đủ.

Đặc tả v2.6 yêu cầu thêm quản lý gói, thông tin gói, quyền lợi, hạn mức, hoa hồng hai phía ở mức định hướng, cập nhật giá dầu thô thế giới và báo cáo sự cố. Các module đó chưa có trong code. Thanh toán online nằm sau MVP. Giá, tỷ lệ, hạn mức và luồng chi tiết trong v2.6 là PROPOSED hoặc OPEN cho tới khi Product Owner duyệt.

FE-05B chưa bắt đầu.

## Lịch sử, không phải cách cài hôm nay

Đừng checkout `feature/cinematic-scroll`. Đừng checkout `integration/coldi-v2.3-mvp` để thử bản nhóm, trừ khi bạn đang review pull request trước khi merge.

Một tài liệu cũ từng nói `main` chỉ có commit khởi tạo `44e4791134690c72a261d91c60388994668fcdcb`. Câu đó đúng vào ngày viết, không còn là hướng dẫn. `docs/mvp-review/` trước file trạng thái 18/10/2026 là ảnh chụp lịch sử. `docs/COLDI_DEMO_GUIDE.md` mô tả giao diện cũ, không dùng để cài đặt.

HISTORICAL DOCUMENT: `docs/Coldi_Documentation_v2.4_Roles_Clarified/`, `docs/product/` và các hồ sơ Core 08 đến Core 14. Phạm vi sản phẩm hiện hành là `docs/v2.6/`. Không sửa các báo cáo kiểm thử cũ cho khớp v2.6.
