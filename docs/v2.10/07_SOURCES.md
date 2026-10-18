# Nguồn đã đọc

v2.10 chỉ ghi lại quyết định và trạng thái. Không sao chép cả cây tài liệu cũ vào Git.

| Nguồn | Đã dùng | Không đưa vào repo |
| --- | --- | --- |
| `docs/v2.7/` trên `main` sau PR #5 | Giá, trần xe, PKG, COM | Không viết lại các file đó |
| CURRENT v2.8 tại `C:\Coldi\docs\COLDI_ALL_BUSINESS_DOCS_v2.8_INCIDENT_OIL_WITH_HISTORY\CURRENT_v2.8` | INC-01..04, OIL-01..04 và mục còn mở | Cả thư mục `HISTORY` lồng bên trong ZIP v2.8 |
| CURRENT v2.9 tại `C:\Coldi\docs\COLDI_CURRENT_BUSINESS_DOCS_v2.9_PACKAGE_PR6_REVIEW\CURRENT_v2.9` | Xác nhận chính sách không đổi và các nhận xét review PR #6 | Trạng thái "PR #6 đang mở, 78 test" vì đã bị merge sau đó thay thế |
| Mã Package trên `main` `2a41797` | Catalog, trần xe, Demo/QA, exclusive assignment, CI | Không nhét source vào bộ tài liệu |
| Prompt phát hành v2.10 | CHAT-01, FORM-01, IMG-01, DRIVER-04, TEXT-01, UX-04 và bảng UAT desktop | Không có biên bản UAT riêng khác trong nguồn đã đọc |

## Phần nguồn không đủ để kết luận thêm

- ZIP v2.8 nói bộ archive 93 file của toàn repository không có trong gói đó. v2.10 dùng `docs/` đã merge trên GitHub cho v2.7, không dùng ZIP đó làm bản hiện hành.
- Không có bảng UAT desktop nào khác ngoài danh sách trong yêu cầu phát hành. Các nhãn PASS, NOT RUN và DEFERRED lấy từ danh sách đó. Đợt này không chạy lại browser.
- Review v2.9 nêu các rủi ro hợp đồng demo, archive/assign, reservation và audit lúc PR #6 mới mở. Các điểm đó đã được xử lý trong các commit sau của PR #6 trước khi merge. v2.10 không mở lại review đó và không coi bản review cũ là trạng thái hiện tại.
- Định dạng và dung lượng ảnh hàng hóa, dung lượng ảnh sự cố, lịch EIA và điều khoản hợp đồng từng khách không có số đã duyệt. Các chỗ đó được để OPEN.

Thư mục giải nén v2.8 và v2.9 trên máy local không bị đổi tên, không bị ghi đè và không được commit.
