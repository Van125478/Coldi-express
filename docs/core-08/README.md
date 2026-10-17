# Core 08 — Tài liệu cho nhóm COLDI

Người mới không cài máy theo bộ này. Hướng dẫn hiện hành là [Team Testing Guide](../team-testing/TEAM_TESTING_GUIDE.md): clone `main`, `npm ci`, API `127.0.0.1:4000`, web `127.0.0.1:5173`. Core 09 đến Core 14 đã có trong kho. Trạng thái MVP ngày 18/10/2026 nằm ở [MVP_STATUS_2026-10-18.md](../mvp-review/MVP_STATUS_2026-10-18.md).

Phần dưới là hồ sơ Core 08, không phải lệnh checkout hiện tại.

Bộ tài liệu này mô tả thư mục làm việc lúc viết Core 08. Đọc theo thứ tự:

1. [Thiết lập máy local](01-thiet-lap.md)
2. [Kịch bản demo ba vai trò](02-kich-ban-demo.md)
3. [Checklist nghiệm thu Core 07 và Core 08](03-checklist-nghiem-thu.md)
4. [Sự cố, kiểm thử tự động và giới hạn](04-su-co-va-gioi-han.md)
5. [Mẫu báo lỗi](05-mau-bao-loi.md)

`docs/COLDI_DEMO_GUIDE.md` là bản mô tả giao diện cũ, viết trước khi có API. Không dùng file đó để cài đặt hoặc demo.

Kho mã không có mẫu issue của GitHub. Khi gặp lỗi, chép [mẫu báo lỗi](05-mau-bao-loi.md) vào tin nhắn cho người điều phối buổi kiểm thử. Không dán mật khẩu, cookie hay file `.env`.

## Hai trạng thái lúc viết Core 08 — Historical Snapshot

Bảng này ghi nhận ngày viết, khi `main` còn là commit khởi tạo. Đừng dùng bảng này để chọn nhánh hôm nay.

| Trạng thái lúc đó | Có gì | Không có gì |
| --- | --- | --- |
| Nhánh `feature/cinematic-scroll` | Timeline tại commit `cd5045300ac4c788deba3c08053ed1a439481d95`, cùng đăng nhập, đăng đơn, nhận chuyến, phân công, xác nhận lấy hàng và giao hàng | Chưa nằm trên `main` của ngày đó |
| `main` của ngày đó | `origin/main` là `44e4791134690c72a261d91c60388994668fcdcb`, commit khởi tạo | Core 01–08 |

`feature/cinematic-scroll` không phải nhánh cho người mới. Bản team testing lấy từ `main`.

Đừng chạy lệnh đặt lại mật khẩu demo. Bản hướng dẫn hiện hành không có lệnh đó.

## Nghiệm thu đã ghi

Ngày 17/10/2026, luồng chính Core 07 đã được bấm trên môi trường local này. Biên bản nằm trong [checklist](03-checklist-nghiem-thu.md). Ô checklist của đồng đội vẫn để trống. Đừng dùng hai đơn đã nghiệm thu để nhận, phân công hoặc xác nhận lại.
