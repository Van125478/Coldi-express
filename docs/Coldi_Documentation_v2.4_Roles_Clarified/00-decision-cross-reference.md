# Đối chiếu mã quyết định COLDI v2.4

Ngày ghi: 17/10/2026. Mã chuẩn là mã trong `Coldi_MasterConst_v2.4.docx`, mục 12.

D-01 đến D-17 giữ nguyên nghĩa đã chốt trước bản làm rõ vai trò. Bản này không đánh số lại các quyết định đó.

## Vì sao có hai dãy số

`Coldi_05_Decisions_Changelog_v2.4.docx` ban đầu dùng lại D-01 đến D-13 cho một bảng tóm tắt và cho năm quyết định vai trò mới. Master Const đã gán năm quyết định đó là D-18 đến D-22. Hai bộ số cùng chữ nhưng khác nghĩa.

Bảng changelog giờ gọi tám dòng tóm tắt là Tóm tắt 1 đến Tóm tắt 8. Năm quyết định vai trò dùng đúng D-18 đến D-22. Chính sách tài khoản tài xế MVP-05 là D-23, mã mới, không ghi đè mã cũ.

## Tóm tắt changelog → mã Master

| Dòng changelog cũ | Nhãn hiện tại | Mã Master tương ứng |
| --- | --- | --- |
| D-01 trong changelog | Tóm tắt 1 | D-18 cho bốn vai trò MVP và WAREHOUSE Phase 2. Không thay D-01 của Master |
| D-02 | Tóm tắt 2 | D-04, Claim nguyên tử |
| D-03 | Tóm tắt 3 | D-05, phân công thủ công |
| D-04 | Tóm tắt 4 | D-07, mốc 1-touch tại Kho A/B |
| D-05 | Tóm tắt 5 | Không có một mã Master riêng cho ba nhóm nhiệt độ. Ngưỡng °C vẫn là D-15 và đang chờ |
| D-06 | Tóm tắt 6 | D-14, giả định tài chính, chưa được áp dụng |
| D-07 | Tóm tắt 7 | Đề xuất kiểm định xe. Chưa phải quyết định Master |
| D-08 | Tóm tắt 8 | D-08 cho gatekeeping chi tiết và D-11 cho geofence, cảnh báo dừng, Dynamic ETA. Cả hai đều Phase 2 |
| D-09 | D-18 | Năm vai trò mục tiêu, bốn vai trò MVP |
| D-10 | D-19 | DRIVER thuộc CARRIER. Cách cấp tài khoản nằm ở D-23 |
| D-11 | D-20 | WAREHOUSE thuộc SHIPPER, Phase 2 |
| D-12 | D-21 | Mapbox GL JS v3. Master D-10 cũng ghi Mapbox và không bị đổi nghĩa |
| D-13 | D-22 | Chưa có Organization/Membership |

## Vai trò

`TARGET_PRODUCT_ROLES`: SHIPPER, CARRIER, DRIVER, WAREHOUSE, ADMIN.

`ACTIVE_MVP_ROLES`: SHIPPER, CARRIER, DRIVER, ADMIN.

WAREHOUSE không có trong enum đăng nhập, route hay giao diện vận hành. Kho A và Kho B là địa điểm của chuyến.

D-01 của Master vẫn ghi định hướng Role Switcher từ v1.7. Ứng dụng MVP hiện tại không có Role Switcher: một tài khoản một vai trò. Hằng số `ROLE_SWITCHER_ENABLED` và `ROLE_CONTEXT_SWITCHING` trong Master được đặt `false` cho ứng dụng hiện tại. D-01 không bị viết lại.

## Nguồn tài liệu

Thư mục này là nguồn đang dùng cho các quyết định đã làm rõ ở v2.4 và cho D-23.

Sáu file docx v2.3 vẫn nằm trong Git tại commit `88a19b1cbb965af831add901e5c8e65970933840` và tiếp tục nằm trong cây đã commit nếu lần commit MVP-05 không stage việc xóa chúng. Quy tắc cũ không bị v2.4 nói lại vẫn đọc từ Master v2.4 và từ bản v2.3 trong Git. Không khôi phục file v2.3 vào thư mục làm việc chỉ để có bản sao thứ hai.
