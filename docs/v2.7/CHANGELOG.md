# Changelog — COLDI tài liệu v2.7 (2026-10-18)

Baseline trước thay đổi này: `main` `30c9d5fea609e041cb56f9634769cf61f13388b4`, PR #4 đã merge bộ v2.6.

## Chính sách mới so với v2.6 đã merge

- **PKG-01** duyệt baseline giá và tỷ lệ cố định. Chưa mở bán online.
- **PKG-02** gói thuộc User account.
- **PKG-03** trần xe ACTIVE: Free 2, Pro tháng và Pro năm 10, Business 30, Enterprise theo hợp đồng.
- **PKG-06B** tự kích hoạt gói trả phí chỉ ở Demo/QA được phép. Production không có đường kích hoạt demo.
- **PKG-07** hết hạn về Free; OVER_LIMIT chặn Claim mới; chuyến và dữ liệu cũ được giữ; hạ gói chủ động vào cuối kỳ; lưu trữ và khôi phục xe được duyệt.
- **COM-01 đến COM-05** duyệt công thức hai phía, snapshot, basis point, half-up tới 1 VND, ESTIMATED rồi ACCRUED, không tự PAID. VAT sau MVP.
- **COM-06** duyệt VOID trước giao, HOLD sau giao theo từng phía, điều chỉnh bất biến. Điều kiện hủy và ngưỡng xét vẫn mở.
- **COM-07A** duyệt mô phỏng sổ cái trong Demo/QA. Không thu tiền, không đối soát tiền thật, không tự PAID.
- **OIL-01** giữ nghĩa giá dầu thô thế giới. Nhà cung cấp, vị trí, nhịp cập nhật và dữ liệu cũ vẫn mở.
- Incident INC-01 đến INC-04 vẫn mở.

## Cách giữ lịch sử

- Không sửa file DOCX v2.4.
- Không mô tả bản chú thích sau merge là nội dung gốc của PR #4.
- Không xóa Core 08–14, FE-05A, mvp-review hay hướng dẫn nhóm.
- Không chạy test mới trong lần đóng tài liệu này. Không khẳng định E2E đã đạt.
