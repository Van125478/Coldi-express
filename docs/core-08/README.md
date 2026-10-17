# Core 08 — Tài liệu cho nhóm COLDI

Bộ tài liệu này mô tả thư mục làm việc hiện tại. Đọc theo thứ tự:

1. [Thiết lập máy local](01-thiet-lap.md)
2. [Kịch bản demo ba vai trò](02-kich-ban-demo.md)
3. [Checklist nghiệm thu Core 07 và Core 08](03-checklist-nghiem-thu.md)
4. [Sự cố, kiểm thử tự động và giới hạn](04-su-co-va-gioi-han.md)
5. [Mẫu báo lỗi](05-mau-bao-loi.md)

`docs/COLDI_DEMO_GUIDE.md` là bản mô tả giao diện cũ, viết trước khi có API. Không dùng file đó để cài đặt hoặc demo.

Kho mã không có mẫu issue của GitHub. Khi gặp lỗi, chép [mẫu báo lỗi](05-mau-bao-loi.md) vào tin nhắn cho người điều phối buổi kiểm thử. Không dán mật khẩu, cookie hay file `.env`.

## Hai trạng thái, không trộn với nhau

| Trạng thái | Có gì | Không có gì |
| --- | --- | --- |
| Nhánh `feature/cinematic-scroll` | Timeline tại commit `cd5045300ac4c788deba3c08053ed1a439481d95`, cùng đăng nhập, đăng đơn, nhận chuyến, phân công, xác nhận lấy hàng và giao hàng | Chưa nằm trên `main` |
| `main` | `origin/main` là `44e4791134690c72a261d91c60388994668fcdcb`, commit khởi tạo | Core 01–08 |

`feature/cinematic-scroll` không phải nhánh cố định cho người mới. Sau khi merge được duyệt, clone `main`. Hash merge chưa tồn tại, nên tài liệu không bịa hash đó.

Đừng chạy `npm run reset:demo-passwords`. Lệnh đó chỉ có trong thay đổi local chưa commit.

## Nghiệm thu đã ghi

Ngày 17/10/2026, luồng chính Core 07 đã được bấm trên môi trường local này. Biên bản nằm trong [checklist](03-checklist-nghiem-thu.md). Ô checklist của đồng đội vẫn để trống. Đừng dùng hai đơn đã nghiệm thu để nhận, phân công hoặc xác nhận lại.
