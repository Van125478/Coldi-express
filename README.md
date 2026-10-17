# COLDI

COLDI là website vận tải lạnh B2B. Chủ hàng đăng đơn. Nhà xe tự nhận chuyến rồi phân công xe và tài xế. Tài xế được phân công xác nhận lấy hàng, sau đó mới xác nhận giao hàng. Xác nhận giao hàng không phải thanh toán.

Tài liệu này mô tả nhánh `integration/coldi-v2.3-mvp`. Nhánh đó chứa luồng đã có từ Core 08, cộng GPS vị trí mới nhất, chat riêng, đội xe, audit, sàn lọc và snapshot tên lúc gán. `main` chưa nhận các commit này. Chưa có nghiệm thu tay trên trình duyệt.

## Lấy mã

```bash
git clone https://github.com/Van125478/Coldi-express.git
cd Coldi-express
git checkout integration/coldi-v2.3-mvp
```

Cần Node.js 20.19 trở lên và npm. Lệnh clone ở trên chưa được thực hiện lại từ một máy sạch trong lượt tạo nhánh. Kiểm tra tự động dùng một worktree local của commit code `95d913284e854e8af4fd058e9310909b4873370c`.

Lúc tạo nhánh, `git ls-remote` thấy GitHub `main` tại `a2a2c3846c04614f34cc0d96effd5b488ee7fdda`. Cây của commit đó không được mở ra. Hash đó không chứng minh `main` đã có hoặc chưa có một tính năng. Ref `origin/main` trên máy làm việc vẫn là `44e4791134690c72a261d91c60388994668fcdcb` vì lượt này không fetch.

`feature/cinematic-scroll` vẫn dừng ở `69ec1a198f0729efc10a3d534dd92d264b1738eb`. Core 07 là `cd5045300ac4c788deba3c08053ed1a439481d95`. Core 08 là commit cùng hash với đầu nhánh feature.

## Tài liệu cho người mới

Đọc theo thứ tự:

1. [Thiết lập máy local](docs/core-08/01-thiet-lap.md)
2. [Kịch bản demo ba vai trò](docs/core-08/02-kich-ban-demo.md)
3. [Checklist nghiệm thu Core 08](docs/core-08/03-checklist-nghiem-thu.md)
4. [Sự cố và giới hạn Core 08](docs/core-08/04-su-co-va-gioi-han.md)
5. [Danh sách nghiệm thu tay hiện tại](docs/mvp-review/07-manual-acceptance-readiness.md)

Mẫu báo lỗi: [docs/core-08/05-mau-bao-loi.md](docs/core-08/05-mau-bao-loi.md).

Core 08 mô tả máy local và luồng đã nghiệm thu trước GPS, chat, đội xe và sàn lọc. Trạng thái các phần mới nằm ở `docs/core-09/` đến `docs/core-13/` và `docs/mvp-review/`. `docs/COLDI_DEMO_GUIDE.md` là bản mô tả giao diện cũ. Không dùng file đó để cài đặt.

## Trạng thái trên nhánh tích hợp

| Phần | Mã và test API | Nghiệm thu tay | Giới hạn còn lại |
| --- | --- | --- | --- |
| Đăng, nhận, gán, lấy, giao | Đã có | Checklist Core 08 đã bấm luồng chính trước đó. Chưa bấm lại trên nhánh này | Giao hàng không phải thanh toán và không sang `COMPLETED` |
| Timeline năm sự kiện | Đã có | Chưa bấm lại | Event `ASSIGNED` mới giữ tên xe và tên tài xế lúc gán. Event cũ không có snapshot vẫn đọc tên hiện tại, không phải bản lịch sử đã chứng minh |
| GPS vị trí mới nhất và bản đồ Mapbox | Đã có mã. Chưa bấm tile thật | Chưa | Mapbox GL JS 3.33.0 khi có token `pk.` và chủ hàng mở bản đồ. Gần kho luôn không áp dụng. Không có ETA hay lộ trình |
| Chat riêng theo đơn và nhà xe | Đã có | Chưa | Chưa chốt thời gian lưu tin. Nhà xe thua vẫn đọc thread cũ là quy tắc tạm |
| Đội xe: thêm, sửa, xem xe; sửa tên tài xế đã gắn | Đã có | Chưa | Chưa có tạo tài khoản tài xế. Chưa có kiểm định xe |
| Audit sau ghi thành công | Đã có | Không có màn hình | Process chết giữa ghi đơn và ghi log có thể mất audit. Không có tenant tổ chức |
| Sàn: tìm, lọc, sắp xếp, so sánh, xác nhận Claim | Đã có | Chưa | Danh sách quét tối đa 500 đơn và trả tối đa 100 dòng |
| Thanh toán, tenant | Chưa làm | — | Còn chờ quyết định ở `docs/mvp-review/04-open-decisions.md`. Bản đồ MVP ghi ở `docs/mvp-review/09-mapbox-live-map.md` |

Worktree sạch của commit code `95d913284e854e8af4fd058e9310909b4873370c` báo `npm test` 51 pass, 0 fail. Web `npm run lint`, `npx tsc -b` và `npm run build` pass trên cùng worktree. Commit README sau commit đó chỉ sửa hai file hướng dẫn. Đó không phải nghiệm thu trình duyệt và không phải clone mới từ GitHub.

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

Bản đồ GPS cần token công khai Mapbox, bắt đầu bằng `pk.`, trong `web/.env.local` với tên `VITE_MAPBOX_PUBLIC_TOKEN`. File đó không được commit. Mẫu và lý do token hạn chế URL sẽ trả 403 tại `127.0.0.1` nằm trong `web/.env.example` và [docs/mvp-review/09-mapbox-live-map.md](docs/mvp-review/09-mapbox-live-map.md). Không có token thì trang vẫn chạy và vẫn hiện tọa độ, nhưng không vẽ bản đồ. Tile thật chưa được bấm.
