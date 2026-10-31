# Package Management — IMPLEMENTED

> Bảng “báo giá” của Business và Enterprise ở dưới là ảnh chụp ngày 18/10/2026. Giá công khai đã chốt sau đó: chủ hàng Enterprise 6.990.000 VND/tháng, hoa hồng 2,5%; nhà xe Business 2.990.000 VND/tháng, hoa hồng 3%, trần 30 xe; nhà xe Enterprise 7.990.000 VND/tháng, hoa hồng 2%, trần 100 xe. Không có gói Enterprise theo năm. Nguồn: [PKG-BIZ-01](../uat/PKG_BIZ_01_APPROVED_POLICY.md). Bản đọc chung: [mô tả dự án và luồng nghiệp vụ](00_MO_TA_DU_AN_VA_LUONG.md).

Module này đã nằm trên `main` qua [PR #6](https://github.com/Van125478/Coldi-express/pull/6). Merge commit `2a41797dae188c1b749a08d85517fb8ec05737c3`. Mã Package được kiểm tra tại `bebab893b18871abd1b2c7ec818d4411db6ceb49`.

GitHub Actions `verify` **PASS** trên commit đó: https://github.com/Van125478/Coldi-express/actions/runs/39109089893

Trước khi push commit đó, suite backend local báo **94 passed, 0 failed** trên database dùng một lần. CI chạy cùng workflow trên MongoDB 7 và database `coldi_ci_test`. Đây không phải nghiệm thu production và không phải thanh toán thật.

## Giá, tỷ lệ và trần xe — không đổi

| Đối tượng | Gói | Giá niêm yết | Hoa hồng | Trần xe ACTIVE |
| --- | --- | ---: | ---: | ---: |
| Shipper | Free | 0 VND/tháng | 5% (500 bps) | không áp dụng |
| Shipper | Pro tháng | 799.000 VND/tháng | 4% (400 bps) | không áp dụng |
| Shipper | Pro năm | 7.990.000 VND/năm | 3,5% (350 bps) | không áp dụng |
| Shipper | Enterprise | báo giá, khoảng chỉ dẫn 5–15 triệu VND/tháng | 2–3% theo hợp đồng | không áp dụng |
| Carrier | Free | 0 VND/tháng | 5% (500 bps) | 2 |
| Carrier | Pro tháng | 799.000 VND/tháng | 4% (400 bps) | 10 |
| Carrier | Pro năm | 9.990.000 VND/năm | 3,5% (350 bps) | 10 |
| Carrier | Business | báo giá, khoảng chỉ dẫn 2–5 triệu VND/tháng | 2,5–3% theo hợp đồng | 30 |
| Carrier | Enterprise | báo giá, khoảng chỉ dẫn 5–20 triệu VND/tháng | 1,5–2,5% theo hợp đồng | theo hợp đồng |

Không có số xe tối thiểu. Xe lưu trữ không tính vào trần. Business và Enterprise không lấy điểm giữa của khoảng giá. Quota đơn Shipper không được tự đặt.

Hoa hồng trong bảng là chính sách đã duyệt. Sổ cái hoa hồng chưa được code. Giá gói trong catalog không tạo bản ghi thanh toán.

## Đã có trong mã

- Catalog công khai và trang gói của Shipper, Carrier.
- Gói gắn một tài khoản. Hết hạn thì hiệu lực về Free.
- OVER_LIMIT chặn Claim mới. Chuyến đã nhận, phân công, lấy hàng, GPS và giao hàng của chuyến đó vẫn tiếp tục.
- Archive chỉ khi xe không gắn chuyến chưa xong. Restore và tạo xe mới tôn trọng trần.
- Demo activation chỉ khi môi trường QA/Demo được cấp phép đủ cờ. `NODE_ENV` một mình không bật đường này. Production không nhận kích hoạt demo và không có cổng thanh toán.
- Điều khoản Business/Enterprise trong demo lấy từ grant do server phát, không lấy giá do client gửi.

Đường dẫn giao diện: `/goi-dich-vu`, `/shipper/goi`, `/carrier/goi`.

## Một xe, một chuyến chưa hoàn thành

Một xe của Carrier chỉ được gắn tối đa một chuyến ở trạng thái chưa kết thúc: `DRAFT`, `MATCHED`, `PICKUP_CONFIRMED`, `IN_TRANSIT`, `INCIDENT`.

Lệnh gán thắng là cập nhật nguyên tử trên bản ghi xe. Request còn lại nhận 409 `vehicle_busy`. Xác nhận giao hàng gỡ đúng chuyến đó. Lease đang được một lệnh gán còn sống giữ thì không bị request khác lấy sau 30 giây. Nếu MongoDB đã ghi chuyến nhưng API mất xác nhận, lease của chuyến đã ghi không bị gỡ.

Regression nằm trong `server/tests/exclusiveAssignment.test.ts`, gồm gán chậm quá 30 giây và mất xác nhận sau khi ghi thành công. CI `verify` của commit trên đã chạy suite này.

Dữ liệu demo cũ có một xe đang gắn nhiều chuyến chưa xong được để nguyên. Gán mới vào xe đó bị từ chối cho đến khi các chuyến thừa được kết thúc bằng luồng giao hàng hiện có. Đợt này không xóa các chuyến đó.

## Chưa có

Thanh toán production, hóa đơn, biên lai, nâng gói giữa kỳ, prorate, quota đơn Shipper và quyền lợi Premium. Các mục đó vẫn OPEN hoặc nằm sau MVP.
