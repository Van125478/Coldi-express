# COLDI

COLDI là website vận tải lạnh cho doanh nghiệp. Chủ hàng đăng đơn. Nhà xe tự nhận chuyến rồi phân công xe và tài xế. Tài xế được phân công xác nhận lấy hàng, sau đó xác nhận giao hàng. Xác nhận giao không phải thanh toán.

**Tài liệu nghiệp vụ hiện hành là v2.10.** Bộ v2.7, v2.6 và hồ sơ v2.4 là tài liệu trước đó. Code trên nhánh này là **WIP / Team Testing**. Đây không phải bản phát hành ứng dụng v2.10 và không phải bản production. MVP chưa hoàn thành. Package Management đã có mã. Commission Management MVP là mô phỏng Demo/QA: khóa tỷ lệ lúc đăng hoặc nhận chuyến, ghi nhận khi giao hàng, không thu tiền. Incident reporting có bản MVP kỹ thuật, giao diện chưa được nghiệm thu. Oil Price chưa được triển khai. Thanh toán production không hoạt động.

## Người mới đọc theo thứ tự này

1. [Cài đặt và chạy máy](docs/team-testing/TEAM_TESTING_GUIDE.md) — Git, Node.js, MongoDB, file cấu hình, mở website.
2. [Cách dùng từng vai trò](docs/team-testing/USER_GUIDE_BEGINNERS.md) — chủ hàng, nhà xe, tài xế, chat, GPS, kịch bản thử từ đầu đến cuối.
3. [Khi gặp lỗi](docs/team-testing/TROUBLESHOOTING.md) — triệu chứng, cách kiểm tra, cách xử lý an toàn.
4. [Tài liệu nghiệp vụ v2.10](docs/v2.10/README.md) — chính sách hiện hành. Package đã có mã. Hoa hồng mô phỏng và báo cáo sự cố có bàn giao kỹ thuật riêng, không sửa chính sách v2.10.
5. [Handoff hoa hồng mô phỏng](docs/commission/MVP_HANDOFF.md) — snapshot, sổ cái, API, guard Demo/QA và phần còn OPEN.
6. [Bàn giao sự cố](docs/incident/MVP_HANDOFF.md) — báo cáo, trạng thái và phần còn bị chặn.
7. [Chính sách v2.7](docs/v2.7/README.md) — giá, gói và hoa hồng lúc PR #5. Trạng thái mới hơn nằm ở v2.10.
8. [Tài liệu v2.6](docs/v2.6/README.md) — bộ đã merge trong PR #4. Chính sách giá và hoa hồng trong đó đã được v2.7 thay.
9. [Trạng thái MVP 18/10/2026](docs/mvp-review/MVP_STATUS_2026-10-18.md) — ảnh chụp phần nào đã có mã tại baseline trước bộ v2.6. Không thay chính sách v2.10.

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

## Tài liệu nghiệp vụ v2.10

CURRENT BUSINESS POLICY. Bản đồ cả thư mục tài liệu: [docs/README.md](docs/README.md).

- [Mục lục v2.10](docs/v2.10/README.md)
- [Package đã có mã](docs/v2.10/02_PACKAGE_IMPLEMENTED.md)
- [Backlog UAT chưa code](docs/v2.10/03_UAT_BACKLOG.md)
- [Nghiệm thu desktop](docs/v2.10/04_DESKTOP_UAT.md)
- [Sự cố và giá dầu](docs/v2.10/05_INCIDENT_AND_OIL.md)
- [Hoa hồng, module kế tiếp](docs/v2.10/06_COMMISSION_NEXT.md)

## Chính sách v2.7 đã merge

EARLIER DOCS cho giá và hoa hồng lúc PR #5. Không còn là trang trạng thái triển khai hiện hành.

- [Mục lục v2.7](docs/v2.7/README.md)
- [Sổ quyết định](docs/v2.7/01_DECISIONS_AND_SCOPE.md)
- [Giá và gói](docs/v2.7/02_PRICING_AND_PACKAGE.md)
- [Vòng đời gói](docs/v2.7/03_PACKAGE_LIFECYCLE_AND_SECURITY.md)
- [Hoa hồng](docs/v2.7/04_COMMISSION_POLICY_AND_LEDGER.md)
- [Mục còn mở: dầu, sự cố, QA](docs/v2.7/06_OPEN_OPERATIONS_OIL_INCIDENT.md)

## Tài liệu v2.6 đã merge

EARLIER DOCS. PR #4 đã merge bộ này. Các câu còn gọi giá là chưa duyệt được chú thích dẫn về v2.7.

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

Package Management đã có mã sau PR #6, gồm trần xe, Demo/QA và một xe một chuyến chưa hoàn thành. Hoa hồng và giá dầu đã được duyệt nhưng chưa có module trên nhánh này. Báo cáo sự cố có MVP kỹ thuật trong [docs/incident/MVP_HANDOFF.md](docs/incident/MVP_HANDOFF.md): báo cáo chữ, RBAC, trạng thái đến kết quả xử lý, phản đối, audit và thông báo trong ứng dụng. Đóng sự cố, leo thang, ảnh chứng cứ, ưu tiên và nhắc việc vẫn khóa vì chính sách còn mở. Giao diện chưa được nghiệm thu. Thanh toán online không hoạt động. Quota đơn Shipper, quyền lợi Premium, điều khoản Enterprise từng khách và nâng gói giữa kỳ vẫn mở.

FE-05B chưa bắt đầu.

## Lịch sử, không phải cách cài hôm nay

Đừng checkout `feature/cinematic-scroll`. Đừng checkout `integration/coldi-v2.3-mvp` để thử bản nhóm, trừ khi bạn đang review pull request trước khi merge.

Một tài liệu cũ từng nói `main` chỉ có commit khởi tạo `44e4791134690c72a261d91c60388994668fcdcb`. Câu đó đúng vào ngày viết, không còn là hướng dẫn. `docs/mvp-review/` trước file trạng thái 18/10/2026 là ảnh chụp lịch sử. `docs/COLDI_DEMO_GUIDE.md` mô tả giao diện cũ, không dùng để cài đặt.

HISTORICAL DOCUMENT: `docs/Coldi_Documentation_v2.4_Roles_Clarified/`, `docs/product/` và các hồ sơ Core 08 đến Core 14. Tài liệu nghiệp vụ hiện hành là `docs/v2.10/`. v2.7 và v2.6 là các bộ đã merge trước đó. Không sửa các báo cáo kiểm thử cũ cho khớp v2.10. Không sửa nội dung DOCX v2.4.
