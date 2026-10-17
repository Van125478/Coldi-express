# MVP-01 — Thứ tự đóng MVP

Mục tiêu: đồng đội chạy được đúng chuỗi nghiệp vụ đang có trên web, rồi mới nghiệm thu tay. Không mở Core mới cho tài chính, bản đồ, tenant hay UI WOW trong đợt này.

## Phân nhóm

| Việc | Nhóm |
| --- | --- |
| Commit có kiểm soát Core 09–13 và FE-01, cập nhật README cho khớp cây đã commit | MUST FIX BEFORE MVP |
| Nghiệm thu tay chuỗi đủ vai trò trên máy sạch, gồm popup Claim, chat, GPS trình duyệt, đội xe, sàn ở 390px | MUST FIX BEFORE MVP |
| Câu ASSIGNED lưu tên lúc gán | SHOULD FIX BEFORE TEAM RELEASE |
| Ghi rõ giới hạn audit, chat provisional, không có tenant | SHOULD FIX BEFORE TEAM RELEASE |
| Phân trang sàn, tìm không dấu, rate limit chat | CAN DEFER TO PHASE 2 hoặc sau pilot |
| SDK bản đồ | CAN DEFER đến khi chọn provider |
| Tách bundle, cinematic, Illustration Lab | UI WOW ONLY hoặc để ngoài bản đồng đội |
| Công nợ, ETA, geofence, app native, Role Switcher | CAN DEFER đến khi có quyết định |

## Checkpoint A — Đóng gói mã đang chạy

Mục tiêu: một người clone nhánh làm việc và cài theo tài liệu sẽ có cùng API với cây hiện tại, gồm GPS, chat, đội xe, audit và sàn.

Phạm vi: commit từng cụm đã có, không trộn `server/.env`, không trộn `resetDemoPasswords.ts` nếu chưa được yêu cầu, không trộn ảnh cinematic và Illustration Lab trừ khi chủ dự án muốn. Sửa README gốc và `server/README.md` để thôi nói rằng GPS, chat và đội xe chưa có, sau khi các cụm đó đã nằm trên nhánh.

Phụ thuộc: không đổi hành vi. Chỉ đóng gói và chỉnh câu chữ tài liệu.

Phải giữ: Claim nguyên tử, nhãn “Chờ lấy hàng”, mốc tài xế, cookie, Origin.

Test: `server` lint, test, build. `web` lint, `tsc -b`, build. Kỳ vọng giữ 45 pass. Nếu số test đổi vì tách commit, ghi số mới, không bịa.

Nghiệm thu tay: chưa cần ở checkpoint này.

Xong khi: nhánh được đẩy theo lệnh riêng của người dùng, README không mâu thuẫn với file trên nhánh đó, và working tree không còn phần MVP đang dấu.

Đợt rà soát này không commit và không push.

## Checkpoint B — Nghiệm thu tích hợp

Mục tiêu: một người chạy đủ 19 bước trên database local của máy đó.

Phạm vi: không thêm tính năng. Dùng `docs/core-13/02-kiem-thu-marketplace.md` cộng thêm lấy hàng, GPS, giao hàng, timeline, đội xe. Không đụng hai đơn đã nghiệm thu `6ad25c2fcf4c13c7d5b735dc` và `6ad2fc6b0f1e6b36c1404649`. Không seed lại nếu máy đã có dữ liệu cần giữ. Máy mới thì seed theo Core 08.

Phụ thuộc: Checkpoint A, hoặc chạy ngay trên cây hiện tại nếu chỉ một máy.

Phải giữ: không Claim bằng chat, không gán tự động, giao xong không thành thanh toán.

Test tự động: chạy lại suite trên database test, không trỏ `MONGODB_URI` vào database `coldi` của demo.

Nghiệm thu tay: bốn vai trò. Sàn ở rộng 390px và desktop. Mở popup Claim rồi hủy. Chat rồi kiểm đơn vẫn PUBLISHED. Sau lấy hàng, chủ hàng thấy phase GPS, không cần thấy bản đồ. Tài xế từ chối quyền vị trí vẫn bấm được giao hàng.

Xong khi: biên bản tay ghi pass/fail từng bước. Fail thì thành lỗi sửa, không thành tính năng mới.

## Checkpoint C — Câu lịch sử phân công

Đã làm trên cây làm việc, chưa commit. Lần gán mới lưu tên xe và tên tài xế trên event. Event cũ không có snapshot vẫn đọc tên hiện tại. Server `npm test` sau sửa: 51 pass, 0 fail. Chi tiết ở `08-timeline-history-fix.md`.

Nghiệm thu tay: gán một chuyến mới, sửa tên xe, mở timeline. Bước đó chưa bấm trên trình duyệt.

## Checkpoint D — Những việc không làm trong đợt đóng

- Không gắn Goong hoặc Mapbox.
- Không thêm `tenant_id` và không migration.
- Không màn audit.
- Không mời tài xế, không xóa xe.
- Không COMPLETED, hủy, hay thanh toán.
- Không bookmark server.
- Không tách bundle chỉ vì cảnh báo Vite.
- Không đưa `/illustration-lab` vào hướng dẫn đồng đội.

## Sẵn sàng cho đồng đội

| Câu hỏi | Kết luận hôm nay |
| --- | --- |
| Clone mới từ GitHub `main` | Chưa. `origin/main` cục bộ vẫn là commit khởi tạo `44e4791`. Không fetch trong đợt này. |
| Clone `feature/cinematic-scroll` tại HEAD `69ec1a1` | Có timeline và tài liệu Core 08. Chưa có GPS, chat, đội xe, audit, sàn lọc, vì các phần đó chưa commit. |
| Cây làm việc trên máy này | Chạy được chuỗi web nếu MongoDB và `.env` local sẵn. Không phải bản người khác clone được. |
| Database test tách | Có. Mỗi file test đổi tên database và từ chối drop nếu sai tên. |
| Bốn vai trò demo | Làm được sau `seed:demo` rồi `seed:fleet` trên máy đó. Seed ghi đè mật khẩu bốn email demo. |
| QA đồng đội | Chưa nên bắt đầu trên bản clone cho đến Checkpoint A. Có thể QA trên một máy được chia sẻ mã nguồn bằng cách khác, ngoài git, nhưng đó không phải luồng đã viết trong Core 08. |
| Commit tách core | Nên tách 09, 10, 11, FE-01, 12, 13 khi người dùng yêu cầu commit. Không gộp ảnh cinematic và script reset mật khẩu. |
| Vào `main` | Chỉ bằng merge được duyệt sau khi nhánh đã chứa đủ cụm và test pass. Không force-push `main`. |
| Attribution | CLI đã tắt gắn Cursor cho commit và PR sau này. IDE vẫn cần người dùng tắt tay nếu chưa tắt. Không viết lại lịch sử. |

Thứ tự còn lại: A đóng gói, rồi B nghiệm thu tay. Snapshot timeline của lần gán mới đã có trên cây làm việc. Bản đồ, tenant, tài xế mới và tài chính đứng ngoài cho đến khi có quyết định ở `04-open-decisions.md`.
