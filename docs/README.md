# Bản đồ tài liệu COLDI

Ba lớp cần đọc tách nhau.

| Lớp | Ý nghĩa | Bắt đầu từ |
| --- | --- | --- |
| CURRENT BUSINESS POLICY v2.10 | Chính sách hiện hành, Package đã có mã, backlog UAT và nghiệm thu desktop | [docs/v2.10/README.md](v2.10/README.md) |
| EARLIER v2.7 | PKG và COM đã merge ở PR #5. Trạng thái triển khai mới hơn nằm ở v2.10 | [docs/v2.7/README.md](v2.7/README.md) |
| EARLIER v2.6 | Bộ đã merge PR #4. Chính sách giá và hoa hồng đã được v2.7 thay | [docs/v2.6/README.md](v2.6/README.md) |
| CURRENT IMPLEMENTED CODE | Logistics, Package, hoa hồng, sự cố và giá dầu thô. Handoff dầu: [oil/MVP_HANDOFF.md](oil/MVP_HANDOFF.md). Bộ v2.10 không bị sửa trong PR dầu | [TEAM_TESTING_GUIDE](team-testing/TEAM_TESTING_GUIDE.md) |
| HISTORICAL DOCUMENT | Hồ sơ v2.4, Core 08–14, mvp-review. Không thay chính sách v2.10 | Mục lịch sử bên dưới |

Code đang chạy không phải bản phát hành ứng dụng v2.10. MVP chưa hoàn thành. Thanh toán production không hoạt động.

## v2.10 — tài liệu nghiệp vụ hiện hành

- [Mô tả dự án và luồng nghiệp vụ](v2.10/00_MO_TA_DU_AN_VA_LUONG.md) — đọc file này trước
- [Trang khởi đầu](v2.10/README.md)
- [Sổ quyết định](v2.10/01_DECISION_REGISTER.md)
- [Package đã triển khai](v2.10/02_PACKAGE_IMPLEMENTED.md)
- [Backlog UAT](v2.10/03_UAT_BACKLOG.md)
- [Nghiệm thu desktop](v2.10/04_DESKTOP_UAT.md)
- [Sự cố và giá dầu](v2.10/05_INCIDENT_AND_OIL.md)
- [Hoa hồng, chưa code](v2.10/06_COMMISSION_NEXT.md)
- [Checklist rủi ro vận hành](v2.10/08_CHECKLIST_RUI_RO_VAN_HANH.md)

## v2.7 — chính sách PKG và COM đã merge

- [Trang khởi đầu](v2.7/README.md)
- [Mục lục](v2.7/INDEX.md)
- [Sổ quyết định](v2.7/01_DECISIONS_AND_SCOPE.md)
- [Giá và gói](v2.7/02_PRICING_AND_PACKAGE.md)
- [Vòng đời gói và Demo/QA](v2.7/03_PACKAGE_LIFECYCLE_AND_SECURITY.md)
- [Hoa hồng và sổ cái](v2.7/04_COMMISSION_POLICY_AND_LEDGER.md)
- [Ma trận kiểm thử](v2.7/05_COMMISSION_TEST_MATRIX.md) — ca kiểm thử, chưa chạy trong đợt này
- [Dầu, sự cố, QA còn mở](v2.7/06_OPEN_OPERATIONS_OIL_INCIDENT.md)
- [Bàn giao triển khai](v2.7/07_IMPLEMENTATION_HANDOFF.md)
- [Phiên bản](v2.7/VERSIONING.md) · [Changelog](v2.7/CHANGELOG.md)

Nghiệm thu bố cục: Carrier Home, phân công chuyến, Driver Home, cấu trúc Chatbox. E2E, chat lưu trên trình duyệt và Mapbox tiles/markers chưa được nghiệm thu đầy đủ. FE-05B vẫn chờ. Hồ sơ: [FE-05A](frontend/FE-05A_Visual_Acceptance_and_Carrier_Backlog_2026-10-17.md).

## v2.6 — bộ đã merge, không còn là chính sách giá hiện hành

- [Trang khởi đầu](v2.6/README.md)
- [Mục lục](v2.6/INDEX.md)
- [Phạm vi MVP](v2.6/product/01_MVP_SCOPE_v2.6.md)
- [Bảng giá gói](v2.6/product/02_PRICING_PACKAGES_v2.6.md) — số liệu lịch sử; baseline hiện hành ở v2.7
- [Hoa hồng hai phía](v2.6/product/03_COMMISSION_POLICY_v2.6.md) — bản thảo lúc PR #4; luật hiện hành ở v2.7
- [Luồng gói](v2.6/product/04_PACKAGE_WORKFLOWS_v2.6.md)
- [Giá dầu thô thế giới](v2.6/product/05_WORLD_OIL_PRICE_v2.6.md) — Brent/WTI, không phải tiêu hao xe
- [Báo cáo sự cố](v2.6/product/06_INCIDENT_REPORTING_v2.6.md)
- [Quyết định còn mở](v2.6/product/07_OPEN_DECISIONS_v2.6.md)
- [Ngoại lệ](v2.6/product/08_EXCEPTION_SCENARIOS_v2.6.md)
- [Kiến trúc đề xuất](v2.6/technical/01_ARCHITECTURE_v2.6.md)
- [API và RBAC draft](v2.6/technical/02_API_RBAC_DRAFT_v2.6.md)
- [Trạng thái](v2.6/qa/01_STATUS_v2.6.md)
- [Kế hoạch nghiệm thu](v2.6/qa/02_ACCEPTANCE_PLAN_v2.6.md)
- [Backlog triển khai](v2.6/qa/03_MVP_IMPLEMENTATION_BACKLOG_v2.6.md)
- [Hướng dẫn người mới trong bộ v2.6](v2.6/team/01_BEGINNER_HANDOFF_v2.6.md)
- [Phiên bản](v2.6/VERSIONING.md) · [Changelog](v2.6/CHANGELOG.md)

Cài đặt Windows đầy đủ: [TEAM_TESTING_GUIDE](team-testing/TEAM_TESTING_GUIDE.md).

## Code đang có và cách chạy

- [Cài đặt](team-testing/TEAM_TESTING_GUIDE.md)
- [Cách dùng từng vai](team-testing/USER_GUIDE_BEGINNERS.md)
- [Khi gặp lỗi](team-testing/TROUBLESHOOTING.md)
- [API](../server/README.md)
- [Ảnh chụp trạng thái 18/10/2026](mvp-review/MVP_STATUS_2026-10-18.md) — báo cáo tại baseline, không phải nghiệm thu v2.6

`server/src/app.ts` gắn health, auth, shipment, chat, carrier shipment, carrier conversation, fleet, driver shipment, gói, hoa hồng, sự cố, `GET /api/market/oil-prices` và `GET /api/market/fuel`. Handoff kỹ thuật: [hoa hồng](commission/MVP_HANDOFF.md), [sự cố](incident/MVP_HANDOFF.md), [giá dầu](oil/MVP_HANDOFF.md), [thị trường nhiên liệu](fuel/MVP_HANDOFF.md).

## Lịch sử — giữ nguyên

- [Quyết định sản phẩm v2.4, 17/10/2026](product/README.md)
- [Master Const và hồ sơ vai v2.4](Coldi_Documentation_v2.4_Roles_Clarified/README_CURSOR.md)
- Core 08 đến Core 14: [thiết lập](core-08/README.md), [GPS](core-09/01-kiem-thu-gps.md), [chat](core-10/01-kiem-thu-chat.md), [đội xe](core-11/01-kiem-thu-fleet.md), [bảo mật](core-12/01-security-matrix.md), [sàn](core-13/01-marketplace-scope.md), [tài khoản tài xế](core-14/01-driver-account-management.md)
- [Frontend](frontend/01-architecture.md)
- [Ảnh chụp mvp-review](mvp-review/01-requirements-matrix.md)

`_ARCHIVE_PREVIOUS` trong ZIP v2.6 không được copy vào repo. Bản nháp tiêu hao nhiên liệu xe trong archive đó không phải yêu cầu hiện hành. Các báo cáo kiểm thử cũ không bị sửa cho khớp v2.6.

Chính sách nghiệp vụ hiện hành là v2.10. Bản giải thích để đưa cho người khác đọc là [mô tả dự án và luồng nghiệp vụ](v2.10/00_MO_TA_DU_AN_VA_LUONG.md). Phiên bản tài liệu và phiên bản ứng dụng là hai việc khác nhau. Core 08 đến Core 14, FE-05A, hướng dẫn nhóm và mvp-review được giữ nguyên. Hồ sơ v2.8 và v2.9 ngoài Git không bị sửa đè.
