# Changelog — COLDI tài liệu v2.10 (2026-10-18)

Baseline: `main` `2a41797dae188c1b749a08d85517fb8ec05737c3`, sau khi PR #5 và PR #6 đã merge.

## So với v2.7 đã nằm trên main

- Package Management được ghi là **IMPLEMENTED** trên `main`, không còn là đặc tả chưa có mã.
- Thêm quy tắc đã có mã: một xe chỉ giữ một chuyến chưa hoàn thành.
- Ghi CI của PR #6 và commit được merge. Không đổi giá, tỷ lệ hoa hồng hay trần xe.
- INC-01 đến INC-04 và OIL-01 đến OIL-04 được ghi là **APPROVED** theo hồ sơ v2.8, và **NOT IMPLEMENTED**.
- Commission giữ **APPROVED**, là module kế tiếp, **NOT IMPLEMENTED**. Không có thanh toán thật.
- Thêm backlog UAT: CHAT-01, FORM-01, IMG-01, DRIVER-04, TEXT-01 là APPROVED và chưa code. UX-04 là đề xuất, chưa duyệt triển khai.
- Thêm bảng nghiệm thu desktop. PASS visual không được nâng thành PASS chức năng đầy đủ. Mobile là DEFERRED.

## Cách giữ lịch sử

- Không sửa nội dung quyết định trong `docs/v2.7/`. Chỉ thêm dòng dẫn sang v2.10.
- Không đưa cây HISTORY của ZIP v2.8 vào repository.
- Không đổi tên hoặc ghi đè thư mục v2.8/v2.9 ngoài Git.
- Không sửa DOCX v2.4, Core 08–14, hay báo cáo kiểm thử cũ.

## 23/10/2026 — bản giải thích cho người đọc

- Thêm [00_MO_TA_DU_AN_VA_LUONG.md](00_MO_TA_DU_AN_VA_LUONG.md). File này gom mô tả dự án và các luồng đã chốt để đọc một mạch.
- Gắn dòng dẫn ở các cổng vào. Không viết đè thân sổ quyết định ngày 18/10/2026.
- Ghi rõ giá Business và Enterprise công khai theo PKG-BIZ-01, và ghi mã hoa hồng, sự cố, giá dầu làm sau ngày viết sổ v2.10.

## 26/10/2026 — checklist rủi ro vận hành

- Thêm [08_CHECKLIST_RUI_RO_VAN_HANH.md](08_CHECKLIST_RUI_RO_VAN_HANH.md). Danh sách để rà rủi ro trên một chuyến và rủi ro nghiệp vụ của cả sàn. Không đổi giá, hoa hồng, sự cố hay giá dầu.
- Bổ sung rủi ro không thanh toán sau giao, lệch đơn và xe, bàn không chốt, hủy lặp. Phần E ghi giả thuyết đang bàn, gồm bảo hiểm Pro trở lên. Phần E chưa phải luật và chưa đổi giá.
