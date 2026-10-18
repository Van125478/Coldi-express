# Chính sách phiên bản tài liệu COLDI

> **Cập nhật 18/10/2026:** phiên bản chính sách hiện hành là **v2.7** tại [docs/v2.7/VERSIONING.md](../v2.7/VERSIONING.md). Đoạn dưới mô tả quy tắc lúc phát hành v2.6 và được giữ để truy lịch sử. v2.7 không viết lại commit PR #4.

- **Phiên bản của bộ trong thư mục này: v2.6**, ngày 18/10/2026, đã được thay bởi v2.7 cho chính sách giá, gói và hoa hồng.
- Theo yêu cầu chủ dự án, **mỗi lần công bố một bản tài liệu có thay đổi nội dung thì tăng phiên bản**, không ghi đè nội dung v2.6 mà không đổi số. **Phiên bản kế tiếp mặc định: v2.7**, trừ khi Product Owner yêu cầu mốc lớn khác.
- Phiên bản của **bộ tài liệu** không có nghĩa là phiên bản code/deployment đã chạy. README phải nói rõ hai khái niệm.
- Sửa chính tả trong bản nháp đang review có thể thực hiện trước khi phát hành; sau khi phát hành ZIP chính thức, mọi thay đổi được đưa vào lần cập nhật số tiếp theo.
- Mỗi phiên bản giữ `CHANGELOG.md`, ngày, phạm vi thay đổi, thay đổi business rules, baseline source, test evidence và người phê duyệt (nếu có).
- Bảng giá, phí, hạn mức, cấu trúc dữ liệu, phân quyền và luồng xử lý sự cố là **thay đổi nghiệp vụ nhạy cảm**: tăng phiên bản docs và cần quyết định Product Owner trước coding.
- Repo Git có thể lưu song song hồ sơ lịch sử `docs/Coldi_Documentation_v2.4_Roles_Clarified/` và tài liệu v2.6; phải ghi nhãn HISTORY vs CURRENT, không âm thầm xóa archive.

| Loại | Ví dụ | Cách xác định |
| --- | --- | --- |
| Documentation version | v2.6 | Được công bố trong bộ ZIP này |
| Source version | `git rev-parse HEAD` | Lấy từ Git thật lúc build/test |
| Product-approved rule | `APPROVED` + mục quyết định | Không suy từ pricing mockup |
| Implementation state | `CODE EXISTS` / `NOT IMPLEMENTED` | Đối chiếu source + test |
