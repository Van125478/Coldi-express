# COLDI

COLDI là website vận tải lạnh B2B. Chủ hàng đăng đơn. Nhà xe tự nhận chuyến rồi phân công xe và tài xế. Tài xế được phân công xác nhận lấy hàng, sau đó mới xác nhận giao hàng. Xác nhận giao hàng không phải thanh toán.

Đây chưa phải toàn bộ MVP trong tài liệu v2.3. GPS, chat, thanh toán, quản lý đội xe và khu quản trị vận hành chưa được làm.

## Tài liệu cho người mới

Đọc theo thứ tự:

1. [Thiết lập máy local](docs/core-08/01-thiet-lap.md)
2. [Kịch bản demo ba vai trò](docs/core-08/02-kich-ban-demo.md)
3. [Checklist nghiệm thu](docs/core-08/03-checklist-nghiem-thu.md)
4. [Sự cố và giới hạn](docs/core-08/04-su-co-va-gioi-han.md)

Mẫu báo lỗi: [docs/core-08/05-mau-bao-loi.md](docs/core-08/05-mau-bao-loi.md).

`docs/COLDI_DEMO_GUIDE.md` là bản mô tả giao diện cũ. Không dùng file đó để cài đặt.

## Hai trạng thái mã nguồn

Đừng trộn hai trạng thái này.

| Trạng thái | Timeline năm sự kiện | Ghi chú |
| --- | --- | --- |
| Nhánh `feature/cinematic-scroll` | Có, tại commit `cd5045300ac4c788deba3c08053ed1a439481d95` | `npm test` của commit đó gồm `tests/timeline.test.ts` |
| `main` | Chưa có | `origin/main` vẫn là commit khởi tạo `44e4791134690c72a261d91c60388994668fcdcb` |

Commit timeline nằm trên nhánh làm việc này, trước tài liệu hướng dẫn. `main` chưa nhận commit đó và chưa có hash merge. Sau khi merge được duyệt, người trong nhóm clone `main`. Trước thời điểm đó, đừng coi `feature/cinematic-scroll` là nhánh cố định.

## Chạy local

Cần Node.js 20.19 trở lên, npm, và MongoDB tại `127.0.0.1:27017`. Chi tiết, biến môi trường và tài khoản demo nằm trong [docs/core-08/01-thiet-lap.md](docs/core-08/01-thiet-lap.md). Không ghi mật khẩu vào Git.

Sau khi Windows khởi động lại, MongoDB phải nghe `127.0.0.1:27017` trước API.

```bash
cd server
npm run dev
```

```bash
cd web
npm run dev
```

Mở `http://127.0.0.1:5173`. API nghe `http://127.0.0.1:4000`. Dùng đúng hai địa chỉ đó, không dùng `localhost`: trên máy này `localhost` phân giải IPv6 trước, và cookie phiên được cấp cho `127.0.0.1`.
