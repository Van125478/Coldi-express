# COLDI — Bộ tài liệu sản phẩm và nghiệp vụ v2.6

**Ngày:** 18/10/2026 · **Loại:** Bản đặc tả để Product Owner duyệt · **Không phải biên bản nghiệm thu code**.

**Phiên bản tài liệu hiện hành: v2.6.** Đây không phải phiên bản phát hành của ứng dụng và không có nghĩa MVP đã hoàn thành.

**Baseline source rà soát gần nhất:** `Van125478/Coldi-express`, `main` tại `7d07e941ace1d3490996c53a6bed36478a6d4836` (PR #3 đã merge). Nếu HEAD thay đổi sau ngày này, phải đối chiếu source lại trước triển khai. Trong phiên soạn v2.6 **không chạy lại** 71 bài test backend hoặc browser E2E. Không có thao tác lên dữ liệu thật.

Bộ này được đưa vào Git tại `docs/v2.6/` từ ZIP `COLDI_v2.6_ALL_DOCS_ONE_ZIP`. `BAT_DAU_O_DAY.md` của ZIP được gộp vào trang này để chỉ còn một trang khởi đầu.

## Bắt đầu ở đây

1. Trang này — phân biệt đã duyệt, đề xuất và chưa chốt.
2. [MVP Scope](product/01_MVP_SCOPE_v2.6.md) — yêu cầu hiện hành của tài liệu.
3. [Bảng giá Shipper/Carrier](product/02_PRICING_PACKAGES_v2.6.md) — bảng giá đề xuất lấy từ ảnh.
4. [Hoa hồng hai phía](product/03_COMMISSION_POLICY_v2.6.md) — hướng A đã chọn; quy tắc chi tiết còn đề xuất.
5. [Luồng gói](product/04_PACKAGE_WORKFLOWS_v2.6.md) — nâng, hạ, hết hạn, hạn mức.
6. [Giá dầu thế giới](product/05_WORLD_OIL_PRICE_v2.6.md) — Brent/WTI. Không phải ghi chép đổ dầu hay tiêu hao xe.
7. [Sự cố vận chuyển](product/06_INCIDENT_REPORTING_v2.6.md) — bản thiết kế nghiệp vụ.
8. [Các quyết định chưa chốt](product/07_OPEN_DECISIONS_v2.6.md).
9. [Kiểm thử và nghiệm thu](qa/02_ACCEPTANCE_PLAN_v2.6.md).
10. [Backlog triển khai](qa/03_MVP_IMPLEMENTATION_BACKLOG_v2.6.md) — kế hoạch giao việc, chưa phải code.
11. [Hướng dẫn nhóm trong bộ v2.6](team/01_BEGINNER_HANDOFF_v2.6.md). Cài đặt Windows đầy đủ vẫn là [TEAM_TESTING_GUIDE](../team-testing/TEAM_TESTING_GUIDE.md).

## 1. Đã chốt ở mức định hướng

- COLDI MVP gồm logistics, quản lý gói dịch vụ, thông tin gói, quyền lợi, hạn mức, **giá dầu thô thế giới**, báo cáo sự cố và nghiệm thu thực tế.
- **Hoa hồng phương án A:** COLDI *dự kiến* thu hai khoản hoa hồng độc lập của **Shipper và Carrier** trên cùng chuyến. Cách triển khai, điểm ghi nhận và phương thức thu tiền cần phê duyệt chi tiết.
- Thanh toán online **không nằm trong bản MVP đang đặc tả**. Đơn `DELIVERY_CONFIRMED` không đồng nghĩa thu tiền hay đã đối soát.
- Bảng giá và hoa hồng trong ảnh do Product Owner cung cấp là **proposal**. Chưa có chỉ thị chốt thành mức phí áp dụng thực tế.
- **Giá dầu thế giới** chỉ là **thông tin giá Brent/WTI được cập nhật có nguồn, đơn vị, ngày quan sát và trạng thái dữ liệu**. Không phải nhập lần đổ dầu, tiêu hao, định mức, chi phí theo xe hoặc chuyến, hay bảng giá dầu bán lẻ Việt Nam.

## 2. Đọc tài liệu theo thứ tự

| Tài liệu | Công dụng |
| --- | --- |
| [Quy định phiên bản](VERSIONING.md) | v2.6 và quy tắc tăng phiên bản |
| [Mục lục v2.6](INDEX.md) | Điều hướng Product, Tech, QA, Team |
| [MVP scope](product/01_MVP_SCOPE_v2.6.md) | Phạm vi và trạng thái code so với kế hoạch |
| [Bảng giá gói](product/02_PRICING_PACKAGES_v2.6.md) | 4 gói Shipper, 5 gói Carrier từ ảnh, điều kiện công bố |
| [Hoa hồng hai phía](product/03_COMMISSION_POLICY_v2.6.md) | Công thức, ví dụ, snapshot, hủy, hoàn, đối soát |
| [Luồng quản lý gói](product/04_PACKAGE_WORKFLOWS_v2.6.md) | Activation, nâng, hạ, quota, expiration, RBAC |
| [Giá dầu thế giới](product/05_WORLD_OIL_PRICE_v2.6.md) | Data feed Brent/WTI, fallback, stale, cập nhật |
| [Báo cáo sự cố](product/06_INCIDENT_REPORTING_v2.6.md) | Use case, sự cố, trạng thái, bảo mật |
| [Quyết định còn mở](product/07_OPEN_DECISIONS_v2.6.md) | Câu hỏi phải được duyệt trước code |
| [Ngoại lệ nghiệp vụ](product/08_EXCEPTION_SCENARIOS_v2.6.md) | Các tình huống phát sinh cần test |
| [Kiến trúc đề xuất](technical/01_ARCHITECTURE_v2.6.md) | Dữ liệu và ranh giới, không tự migrate schema |
| [API và RBAC draft](technical/02_API_RBAC_DRAFT_v2.6.md) | Contract **DRAFT**, không phải endpoint có thật |
| [MVP status](qa/01_STATUS_v2.6.md) | Code, test, UAT phân biệt minh bạch |
| [Acceptance plan](qa/02_ACCEPTANCE_PLAN_v2.6.md) | Acceptance criteria cho vận tải, gói, hoa hồng, dầu và sự cố |
| [Backlog triển khai](qa/03_MVP_IMPLEMENTATION_BACKLOG_v2.6.md) | Task Backend, Frontend, QA. Chỉ để lập kế hoạch |
| [Hướng dẫn người mới](team/01_BEGINNER_HANDOFF_v2.6.md) | Đọc, cài, chạy, thử an toàn |
| [Đưa docs lên Git](team/02_GIT_INTEGRATION_v2.6.md) | Tách nhánh, review PR, không đè code đang sửa |
| [UX copy](team/03_UX_COPY_v2.6.md) | Text, empty state, error được đề xuất cho FE |
| [Changelog](CHANGELOG.md) | Điều chỉnh từ v2.4 sang v2.6 |

Bản đồ toàn repository, gồm hồ sơ lịch sử: [docs/README.md](../README.md).

## 3. Chú giải bắt buộc

- **APPROVED:** Quyết định định hướng đã được Product Owner nói rõ.
- **PROPOSED / DRAFT:** Đề xuất nghiệp vụ trong v2.6. Không được tự code khi chưa duyệt.
- **OPEN:** Chưa quyết định. Không giả định ngầm.
- **CODE EXISTS:** Đã thấy source. Không đồng nghĩa UAT PASS.
- **NOT IMPLEMENTED:** Chưa có module trong source baseline.
- **UAT PENDING / E2E NOT VERIFIED:** Chưa có biên bản chạy luồng qua browser trên DB QA riêng.

Không được xem mọi dòng trong v2.6 là business rule đã duyệt.

## 4. Nguồn ZIP và phần không đưa vào Git

Các file ở `docs/v2.6/` là bản đặc tả v2.6 hiện hành.

Thư mục `_ARCHIVE_PREVIOUS` trong ZIP **không được copy**. Bản lịch sử đã có trong repository được giữ nguyên, gồm `docs/Coldi_Documentation_v2.4_Roles_Clarified/`, `docs/product/`, `docs/mvp-review/` và `docs/core-08/` đến `docs/core-14/`.

Bản nháp `MVP_FUEL_STATISTICS_SPEC_DRAFT.md` trong archive của ZIP mô tả đổ dầu và tiêu hao xe. Bản đó **không phải yêu cầu hiện hành**. Yêu cầu dầu của v2.6 là [giá dầu thô thế giới](product/05_WORLD_OIL_PRICE_v2.6.md).

Khi tài liệu lịch sử và v2.6 khác nhau:

- **HISTORICAL DOCUMENT:** hồ sơ tại thời điểm viết.
- **CURRENT v2.6 PRODUCT SCOPE:** đặc tả trong thư mục này, gồm cả mục PROPOSED và OPEN.
- **CURRENT IMPLEMENTED CODE:** source trên `main` tại baseline ở trên, cho tới khi có commit mới.

Source đang chạy vẫn là chuẩn để khẳng định tính năng đã có mã. v2.6 là đề xuất phạm vi sản phẩm mới nhất và vẫn cần Product Owner ký các quyết định chi tiết.
