# COLDI v2.4 — Documentation handoff to Cursor

> **Chính sách giá, gói và hoa hồng hiện hành:** [v2.7](../v2.7/README.md) và [CURRENT_POLICY_v2.7.md](CURRENT_POLICY_v2.7.md). File DOCX trong thư mục này không bị sửa. Quyết định vai trò bên dưới vẫn là hồ sơ v2.4.

Ngày cập nhật: 17/10/2026. Bản v2.4 là bản sửa **tài liệu quyết định**, kế thừa bộ v2.3 và làm rõ 5 role mục tiêu / 4 role MVP. Không phải bằng chứng source đã triển khai tính năng mới.

## Danh mục

1. `Coldi_MasterConst_v2.4.docx` — nguồn nghiệp vụ ưu tiên, gồm Decision D-18 đến D-23 và hằng số TypeScript v2.4.
2. `Coldi_01_Product_Business_v2.4.docx` — nghiệp vụ và quan hệ tài khoản con.
3. `Coldi_02_UIUX_Spec_v2.4.docx` — giới hạn màn Warehouse/Driver cho UX.
4. `Coldi_03_Technical_IDE_Handoff_v2.4.docx` — chính sách authorization, rollout và kiểm thử.
5. `Coldi_04_Business_Finance_v2.4.docx` — không suy diễn tài chính từ vai trò mới.
6. `Coldi_05_Decisions_Changelog_v2.4.docx` — tóm tắt vận hành và các quyết định D-18..D-23.
7. `00-decision-cross-reference.md` — bảng đối chiếu mã cũ của changelog với mã Master.
8. `VERSION.md` — quan hệ giữa bộ v2.4 đang dùng và bộ v2.3 vẫn nằm trong Git.

## Quyết định chuẩn

- Role **mục tiêu sản phẩm** (`TARGET_PRODUCT_ROLES`): `SHIPPER`, `CARRIER`, `DRIVER`, `WAREHOUSE`, `ADMIN`.
- Role **đang bật trong MVP** (`ACTIVE_MVP_ROLES`): `SHIPPER`, `CARRIER`, `DRIVER`, `ADMIN`.
- Mã vai trò mới là D-18 đến D-22. Changelog không còn dùng lại D-09 đến D-13 cho các quyết định này.
- `DRIVER` là **tài khoản con do CARRIER quản lý**. Chính sách tạo, mật khẩu tạm, đổi lần đầu, khóa/mở và đặt lại mật khẩu là D-23. Mô tả thực thi nằm ở `docs/core-14/`.
- `WAREHOUSE` là **tài khoản con thuộc SHIPPER**, phục vụ duyệt hàng/đồng kiểm Phase 2. Chưa tạo enum/database auth/route/UI cho WAREHOUSE ở MVP.
- **Kho A/B là điểm lấy/giao** trong Shipment, *không phải role*. Có thể có điểm Kho A/B dù không có tài khoản WAREHOUSE.
- Không thêm xác nhận từ Warehouse trước khi Driver Pickup hoặc Delivery; trạng thái hiện hành giữ nguyên.
- Cách ly role/relationship đã có **không có nghĩa** Organization/Membership/tenant_id đã hoàn thiện. Đó là D-22, chưa triển khai.
- Ứng dụng hiện tại không có Role Switcher. D-01 vẫn giữ câu định hướng từ v1.7 và không bị đánh số lại.
- Live Map Web đã chọn **Mapbox GL JS v3**; build/test code xong trên integration, tile/marker trực quan còn chờ nghiệm thu.
- Không tự thay đổi các quyết định Claim, tài chính, GPS, Timeline, Phase 2 khác.

## Trạng thái thực thi tại thời điểm bàn giao

Điểm xuất phát của MVP-05 là nhánh `integration/coldi-v2.3-mvp` HEAD `88a19b1cbb965af831add901e5c8e65970933840`, lúc đó 55 backend tests PASS. Sau D-23, suite backend là 60 PASS, 0 FAIL. Frontend lint, typecheck và build PASS. Chưa nghiệm thu trình duyệt cho Live Map và cho màn tài khoản tài xế.

## Hướng dẫn đưa cho Cursor

1. Giải nén toàn bộ tài liệu này tại ví dụ `C:\Coldi\docs\product-v2.4\` (hoặc thư mục docs tương đương).
2. Yêu cầu Cursor đọc Master Const và Decisions Changelog trước, rồi đọc Product/Technical/UIUX/Finance theo tác vụ.
3. So sánh code thực tế với docs; **không tự động thêm role WAREHOUSE hoặc đổi state machine**.
4. Cấp tài khoản Driver theo D-23 và `docs/core-14/`. Không tự thêm chuyển nhà xe, email mời, giấy tờ, WAREHOUSE hay Organization/Membership.
5. Không commit/push/merge chỉ vì nhập tài liệu; luôn chờ yêu cầu Git cụ thể.

Dùng v2.4 cho quyết định đã ghi trong Change Log và D-23. Bộ docx v2.3 vẫn nằm trong Git. Xem `VERSION.md`. Không stage việc xóa các file v2.3 nếu thư mục làm việc đang thiếu chúng.
