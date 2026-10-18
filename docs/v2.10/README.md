# COLDI — Tài liệu nghiệp vụ hiện hành v2.10

**Ngày:** 18/10/2026. **Loại:** chính sách nghiệp vụ và trạng thái triển khai. **Không phải** bản phát hành production và **không phải** nghiệm thu mobile.

**Baseline Git:** `Van125478/Coldi-express` `main` `2a41797dae188c1b749a08d85517fb8ec05737c3`.

Commit này là merge [PR #6](https://github.com/Van125478/Coldi-express/pull/6). Cha của nó là merge [PR #5](https://github.com/Van125478/Coldi-express/pull/5) `596ff28601a9fd3e0b57e1dc3998fbd0fa1bc85b` và HEAD Package `bebab893b18871abd1b2c7ec818d4411db6ceb49`.

Khi v2.10 khác một bản cũ hơn về trạng thái triển khai hoặc về Incident/Oil, **dùng v2.10**. Giá, tỷ lệ hoa hồng và trần xe không đổi so với v2.7/v2.8/v2.9. Bộ v2.7 trong Git được giữ nguyên nội dung quyết định. Hồ sơ v2.8 và v2.9 nằm ngoài repository và không bị sửa đè.

## Đọc theo thứ tự

1. [Sổ quyết định](01_DECISION_REGISTER.md)
2. [Package đã có trong code](02_PACKAGE_IMPLEMENTED.md)
3. [Backlog UAT đã duyệt, chưa code](03_UAT_BACKLOG.md)
4. [Nghiệm thu desktop](04_DESKTOP_UAT.md)
5. [Sự cố và giá dầu](05_INCIDENT_AND_OIL.md)
6. [Hoa hồng — module kế tiếp](06_COMMISSION_NEXT.md)
7. [Nguồn đã đọc và phần không đưa vào repo](07_SOURCES.md)

[Mục lục](INDEX.md) · [Phiên bản](VERSIONING.md) · [Changelog](CHANGELOG.md)

## Ba việc cần tách

| Việc | Trạng thái trong v2.10 |
| --- | --- |
| Quyết định đã duyệt | Giữ nguyên. Không đổi giá, hoa hồng, trần xe, bảo mật Demo/QA. |
| Đã có mã trên `main` | Logistics trước đó, cộng Package Management và một xe một chuyến chưa hoàn thành. |
| Chưa có mã | Commission, Incident, Oil Price, CHAT-01, FORM-01, IMG-01, DRIVER-04, TEXT-01. UX-04 chưa được duyệt để làm. Mobile để sau. |

Thanh toán production không hoạt động. Kích hoạt gói trả phí chỉ có trong Demo/QA được cấp phép.
