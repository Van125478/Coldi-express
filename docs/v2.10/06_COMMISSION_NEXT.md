# Hoa hồng — module kế tiếp, NOT IMPLEMENTED

COM-01 đến COM-07A vẫn là chính sách đã duyệt từ v2.7 và được v2.8/v2.9 giữ nguyên. Chưa có snapshot hoa hồng, sổ cái, đối soát hay màn hình hoa hồng trên `main`.

## Luật đã duyệt, chưa code

- Hai khoản phí riêng, Shipper và Carrier, trên cùng `listedPriceVnd`.
- Tỷ lệ lưu bằng basis point nguyên trong snapshot bất biến. 5% = 500, 4% = 400, 3,5% = 350.
- Làm tròn half-up từng bên tới 1 VND, rồi mới cộng. Không làm tròn trên tổng.
- Snapshot Shipper khi đăng đơn thành công. Snapshot Carrier khi Claim thắng. Đổi gói sau đó không sửa snapshot cũ.
- `ESTIMATED` khi có snapshot. `ACCRUED` chỉ khi giao hàng được xác nhận. Không tự sang `PAID`.
- Hủy hợp lệ trước giao thì `VOID` phần ước tính đang có. Sau giao, HOLD theo từng phía khi được phép. Điều chỉnh là bản ghi mới, không sửa số gốc.
- Sự cố không tự HOLD và không tự hủy phí.
- Mô phỏng, nếu được làm, chỉ trong Demo/QA. Không thu tiền, không chi trả, không hoàn tiền và không đánh dấu đã thu.

## Vẫn OPEN

Điều kiện hủy theo từng giai đoạn chuyến, ngưỡng và quyền HOLD/RELEASE/ADJUST, cách xét tranh chấp. Nâng gói giữa kỳ không thuộc hoa hồng và cũng vẫn OPEN.

## Việc kế tiếp

Commission Management là module làm sau bộ tài liệu này. Đợt v2.10 không tạo collection, API hay màn hình hoa hồng. Không nối cổng thanh toán production.
