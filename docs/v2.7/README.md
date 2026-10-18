# COLDI — Chính sách nghiệp vụ hiện hành v2.7

> **Hiện hành là [v2.10](../v2.10/README.md).** Bộ này giữ quyết định PKG và COM lúc PR #5. INC-01 đến INC-04 và OIL-01 đến OIL-04 đã được duyệt sau đó và được ghi ở v2.10. Package đã có mã sau PR #6. Câu "chưa có module" bên dưới đúng với baseline của chính file này.

**Ngày:** 18/10/2026. **Loại:** Product/Business source of truth. **Không phải** phiên bản phát hành ứng dụng và **không phải** biên bản code đã triển khai.

**Baseline Git đã đối chiếu:** `Van125478/Coldi-express` `main` `30c9d5fea609e041cb56f9634769cf61f13388b4` (merge PR #4). Package, Commission, Oil Price và Incident Reporting chưa có module đầy đủ trong source. Nghiệm thu bố cục (Carrier Home, phân công chuyến, Driver Home, cấu trúc Chatbox) không thay cho E2E, chat lưu dữ liệu trên trình duyệt, hay Mapbox tiles/markers.

Khi v2.7 và một bản cũ khác nhau, **v2.7 được dùng**. Bản gốc v2.6 đã merge vẫn nằm trong Git tại commit trên. DOCX v2.4 không bị sửa.

## Đọc theo thứ tự

1. [Phạm vi và sổ quyết định](01_DECISIONS_AND_SCOPE.md)
2. [Giá gói và hạn mức xe](02_PRICING_AND_PACKAGE.md)
3. [Vòng đời gói và cách ly Demo/QA](03_PACKAGE_LIFECYCLE_AND_SECURITY.md)
4. [Hoa hồng và sổ cái](04_COMMISSION_POLICY_AND_LEDGER.md)
5. [Ma trận kiểm thử hoa hồng và gói](05_COMMISSION_TEST_MATRIX.md)
6. [Giá dầu, sự cố và các mục còn mở](06_OPEN_OPERATIONS_OIL_INCIDENT.md)
7. [Bàn giao triển khai](07_IMPLEMENTATION_HANDOFF.md)
8. [Mục lục](INDEX.md) · [Phiên bản](VERSIONING.md) · [Changelog](CHANGELOG.md)

## Đã duyệt trong v2.7

- **PKG-01:** Giá và tỷ lệ cố định là baseline thương mại dự kiến chính thức. Chưa có bán gói online.
- **PKG-02:** Gói thuộc tài khoản User. Driver không mua gói.
- **PKG-03:** Trần xe ACTIVE của Carrier: Free 2, Pro tháng/năm 10, Business 30, Enterprise theo hợp đồng. Xe lưu trữ không tính vào trần. Không lưu trữ xe đang gắn chuyến chưa xong.
- **PKG-06B:** Tự kích hoạt gói trả phí chỉ trong môi trường Demo/QA được cấp phép tường minh. Production từ chối.
- **PKG-07:** Hết hạn về Free. OVER_LIMIT chặn Claim mới, giữ chuyến và dữ liệu cũ. Hạ gói chủ động có hiệu lực cuối kỳ.
- **COM-01 đến COM-07A:** Hai phí độc lập trên `listedPriceVnd`, basis point nguyên, làm tròn half-up từng bên tới 1 VND, ESTIMATED rồi ACCRUED khi DELIVERY_CONFIRMED, không tự PAID. Hủy hợp lệ trước giao thì VOID. Sau giao thì HOLD theo từng phía khi được phép. Điều chỉnh bất biến có audit. Mô phỏng chỉ trong Demo/QA.
- **OIL-01:** Giá dầu thô thế giới (ví dụ Brent/WTI), không phải tiêu hao hay lần đổ dầu của xe.

## Vẫn mở — không được tự đặt luật

Hạn mức số đơn Shipper, quyền lợi Premium chi tiết, điều khoản hợp đồng Enterprise từng tài khoản, nâng gói giữa kỳ, điều kiện hủy chuyến, ngưỡng và quyền xét HOLD/RELEASE/ADJUST, INC-01 đến INC-04, nhà cung cấp giá dầu, vị trí hiển thị, nhịp cập nhật và quy tắc dữ liệu cũ.

## Ba lớp cần tách

| Lớp | Ý nghĩa |
| --- | --- |
| CURRENT BUSINESS POLICY | Thư mục này |
| EARLIER DOCS | [v2.6](../v2.6/README.md) và [v2.4](../Coldi_Documentation_v2.4_Roles_Clarified/README_CURSOR.md), đã được chú thích dẫn về v2.7 |
| IMPLEMENTED CODE | Logistics trên `main`. Không gồm gói, hoa hồng, giá dầu, sự cố |

Bản đồ cả repository: [docs/README.md](../README.md).
