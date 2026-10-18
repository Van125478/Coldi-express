# COLDI v2.6 — Cách đưa tài liệu vào GitHub an toàn

**Ghi chú tích hợp:** các bước bên dưới mô tả quy trình lúc ZIP còn nằm ngoài repo. Bộ hiện hành đã được đặt tại `docs/v2.6/` trên nhánh `docs/coldi-v2.6-integration`, tách bằng worktree từ `origin/main`. PR docs-only chờ Product Owner review. Chưa merge. Không có thay đổi `server/` hay `web/`.

**Trạng thái lúc soạn ZIP:** bộ docs được tạo ngoài repo. Một lượt kết nối GitHub trước đó từ chối tạo nhánh (`403 Resource not accessible by integration`). Không force-push và không yêu cầu gửi token.

## 1. Nguồn và phạm vi

- Repo `Van125478/Coldi-express`, HEAD `main` lần rà soát `7d07e941ace1d3490996c53a6bed36478a6d4836`, PR #3 đã merge.
- ZIP chứa file markdown v2.6 **độc lập**. Không ghi đè mã nguồn `server/` hoặc `web/`, không xóa DOCX gốc. Đặc tả v2.6 có rule mới PROPOSED, chưa phải yêu cầu code được duyệt.
- V2.4 Master DOCX và docs historical được bảo tồn. Trong repo có thể chọn đặt nguyên thư mục `docs/v2.6/` rồi update README root link canonical sau review.

## 2. Quy trình Cursor được phép khi user yêu cầu

1. `git fetch origin`; xác minh branch/HEAD/PR status và `git status --short`; tuyệt đối bảo vệ dirty working tree hiện tại.
2. Tạo **worktree/clone docs-only riêng** từ mới nhất của `origin/main`, tránh checkout/reset thư mục `C:\Coldi` đang bẩn.
3. Giải nén ZIP vào thư mục tài liệu có tên phiên bản rõ như `docs/v2.6/` (tùy quy tắc repo), xử lý duplicate README để không gây hiểu lầm README root đã thay thế.
4. Link từ README root/doc index tới scope, pricing, commission, oil feed, incident, QA; để historical archive là history.
5. Soát nội dung against latest code, không ghi sai trạng thái endpoint. Giải quyết xung đột với docs v2.4 bằng banner latest-v2.6 chứ không xóa các tài liệu cũ âm thầm.
6. Validate Markdown relative links, UTF-8, version/date, `git diff --check`, no secrets, no `.env`, no asset ngoài scope.
7. Stage **chọn lọc** Markdown, commit `docs: integrate COLDI v2.6 product and business specifications`, push branch riêng và tạo PR **docs-only** → `main`; chờ người dùng review, không auto-merge.
8. Sau approve mới merge; verify HEAD mới và hướng dẫn team pull.

## 3. Không được

- Không `git add -A`, `git reset --hard`, stash, clean, force push; không tự push `main`.
- Không sửa DB, chạy seed/reset demo; không xóa draft cinematic/Illustration Lab, DOCX v2.3 hay assets local chưa commit.
- Không đổi API/roles/states chỉ để docs đúng; nếu docs lệch code, ghi NOT IMPLEMENTED/DRAFT và kiến nghị feature task riêng.
- Không tự thực hiện cấp gói, tính hoa hồng, lấy giá dầu từ API thật hoặc tạo incident mock để giả nghiệm thu.

## 4. Những việc Product Owner phải duyệt trước coding

Các ô P0 tại [Open Decisions](../product/07_OPEN_DECISIONS_v2.6.md), nhất là xác nhận bảng giá, snapshot rate, fee handling, cap/entitlement, nguồn dầu, RBAC sự cố. Giữ số phiên bản v2.6 cho bản docs này; nếu thay đổi sau review, phát hành v2.7.
