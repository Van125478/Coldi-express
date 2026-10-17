# Quan hệ tài liệu v2.3 và v2.4

Bản v2.4 trong thư mục này là nguồn ưu tiên cho các quyết định đã được làm rõ: năm vai trò mục tiêu, bốn vai trò MVP, DRIVER thuộc CARRIER, WAREHOUSE thuộc SHIPPER ở Phase 2, Mapbox, và việc chưa triển khai Organization/Membership.

Master Const v2.4 vẫn chứa D-01 đến D-17. Những mã đó giữ nghĩa cũ. Quyết định vai trò mới là D-18 đến D-22. Chính sách tài khoản tài xế được duyệt cho MVP-05 là D-23. Bảng đối chiếu nằm ở `00-decision-cross-reference.md`.

Bộ docx v2.3 đã có trong commit `88a19b1cbb965af831add901e5c8e65970933840`. Người dùng thay bản làm việc bằng v2.4. Lần ghi MVP-05 không stage việc xóa các file v2.3, nên bản đã commit vẫn truy cập được bằng Git. Không coi việc thiếu file v2.3 trong thư mục làm việc là quyết định xóa nguồn.

Phần v2.4 không nói lại vẫn theo Master v2.4 và bản v2.3 trong Git. Claim, phân công, mốc lấy/giao, GPS, Marketplace và phạm vi tài chính đã chốt không bị D-23 đổi. D-14 vẫn là giả định tài chính chờ thẩm định.

Ứng dụng hiện tại không bật WAREHOUSE và không có Role Switcher. Việc cấp tài khoản tài xế được mô tả ở `docs/core-14/01-driver-account-management.md`. Nghiệm thu trình duyệt của luồng đó và của tile Mapbox vẫn chưa thực hiện.
