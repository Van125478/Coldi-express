# COLDI Docs Update Package — 17/10/2026

Bản này **chưa được commit/push**. Nó bao gồm các tài liệu Markdown cần được bổ sung vào đúng nhánh `integration/coldi-v2.3-mvp` sau khi chủ dự án cho phép:

1. `docs/product/COLDI_v2.4_Product_Decisions_2026-10-17.md` — biên bản **toàn bộ quyết định sản phẩm** trong chuỗi hội thoại, bao gồm Account, Guest/Login, Marketplace một trang, Carrier Detail, Mapbox, Shipper/Driver, UI/UX, scope/phase, Git và điều kiện nghiệm thu.
2. `docs/frontend/FE-05A_Visual_Acceptance_and_Carrier_Backlog_2026-10-17.md` — ma trận nghiệm thu và các điểm Carrier còn cần xử lý sau screenshot review.

## Cách tích hợp an toàn với working tree của Cursor

- Chỉ làm việc trên `integration/coldi-v2.3-mvp`.
- Không viết đè `docs/frontend/05a-desktop-ui-review.md` bằng bản lấy từ GitHub, vì Cursor đang có sửa đổi **chưa commit** trong file đó.
- Thêm hai Markdown mới, sau đó kiểm tra `git status`, diff và các thay đổi đang có. Chỉ khi user yêu cầu mới commit/push.
- Khi hòa giải docs v2.4, phân biệt nội dung đã chốt với backlog và `LÀM SAU`. Đặc biệt **WAREHOUSE không phải role đang chạy**, self-signup và business verification chưa có trong MVP code.
- Có thể thêm liên kết tới hai tài liệu mới từ `docs/frontend/05a-desktop-ui-review.md`, `docs/frontend/02-carrier-workspace-ui.md` và `docs/core-13/01-marketplace-scope.md` **sau khi** kiểm tra nội dung local mới nhất, không dùng bản GitHub cũ để overwrite.

## Bản đã đưa vào cây tài liệu

Gói trong thư mục này giữ nguyên lời gốc.

Bản đang dẫn:

- `docs/product/COLDI_v2.4_Product_Decisions_2026-10-17.md`
- `docs/frontend/FE-05A_Visual_Acceptance_and_Carrier_Backlog_2026-10-17.md`

Hai file đó có thêm trạng thái sau khi gỡ preview khỏi UI. Gói này không bị xóa.

## Nguyên tắc nguồn

- Quyết định sản phẩm: thống nhất của người dùng trong cuộc trò chuyện.
- Trạng thái code: repo GitHub tại commit đã đọc và báo cáo Cursor cung cấp; không mặc định các thay đổi chưa commit đã có trên GitHub.
- Bản cập nhật **không** có chức năng build/run/change DB, không thêm code và không thay đổi Git history.
