# Quy tắc phiên bản — v2.7

- **Bản chính sách hiện hành:** v2.7, ngày 18/10/2026.
- Phiên bản tài liệu không phải phiên bản ứng dụng và không phải bằng chứng test đã chạy.
- `docs/v2.6/` là bộ đã merge trong PR #4 tại `30c9d5fea609e041cb56f9634769cf61f13388b4`. Các câu trong v2.6 nói giá chưa duyệt, trần xe chỉ là đề xuất, gói trả phí luôn cần Admin duyệt, hoặc COM-02 đến COM-07 còn mở, **không còn là chính sách hiện hành**. Các file đó được chú thích dẫn về v2.7. Nội dung gốc lúc merge vẫn truy được bằng Git, không bị viết lại thành như thể PR #4 đã chứa các quyết định v2.7.
- `docs/Coldi_Documentation_v2.4_Roles_Clarified/` giữ nguyên file DOCX. Chính sách thương mại mới không được ghi đè vào DOCX. Điểm vào là [CURRENT_POLICY_v2.7.md](../Coldi_Documentation_v2.4_Roles_Clarified/CURRENT_POLICY_v2.7.md).
- Thứ tự ưu tiên khi đọc nghiệp vụ giá, gói và hoa hồng: **v2.7, rồi v2.6 đã chú thích, rồi hồ sơ v2.4**.
- Core 08–14, FE-05A, FE-05B, Mapbox, logistics và hướng dẫn QA nhóm được giữ nguyên. Chúng không bị thay bằng bản tóm tắt.

| Loại | Ví dụ | Cách xác định |
| --- | --- | --- |
| Documentation version | v2.7 | Thư mục này |
| Earlier documentation | v2.6, v2.4 | Git history và DOCX |
| Source version | `git rev-parse HEAD` | Commit đang build hoặc test |
| Implemented feature | Logistics trên `main` | Đối chiếu source |
| Proposed, not built | Package, Commission, Oil, Incident | Tài liệu v2.7, chưa có module |
