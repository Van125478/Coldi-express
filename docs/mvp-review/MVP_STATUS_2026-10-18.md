# Trạng thái MVP — 18/10/2026

Bản này là trạng thái đối chiếu cho WIP / Team Testing. Không phải biên bản MVP hoàn thành.

Các file `01` đến `09` trong thư mục này là ảnh chụp lịch sử của các lượt rà soát trước. Số test, SHA và câu “chưa có tài khoản tài xế” trong những file đó không còn là kết luận hiện hành.

## Nguồn mã được kiểm tra

Nhánh làm việc lúc chuẩn bị: `integration/coldi-v2.3-mvp`.

HEAD đã có trên remote trước lượt đóng gói này: `fe1e9207dc1f27cf735876205afde204b967c3fb`.

SHA người thử cần ghi là `git rev-parse HEAD` trên `main` sau khi pull. Đừng gắn SHA của commit chuẩn bị làm SHA merge.

## Logistics đã có mã

- Đăng đơn, sàn, claim nguyên tử, phân công đúng chủ xe và tài xế.
- Xác nhận lấy (`IN_TRANSIT`, sự kiện `PICKUP_CONFIRMED`) và xác nhận giao (`DELIVERY_CONFIRMED`).
- Timeline năm sự kiện: `PUBLISHED`, `CLAIMED`, `ASSIGNED`, `PICKUP_CONFIRMED`, `DELIVERY_CONFIRMED`.
- Chat không claim và không đổi giá. Hộp thoại là giao diện mới.
- GPS: tài xế gửi khi được gán và đang `IN_TRANSIT`. Chủ hàng đọc đơn mình tạo qua `GET /api/shipments/:id/location`. Nhà xe đã nhận đọc qua `GET /api/carrier/shipments/:id/location`. Quản trị và khách không được cấp quyền đọc.
- Đội xe và Core 14: nhà xe tạo, khóa, mở khóa và đặt lại mật khẩu tài xế. Tài xế đổi mật khẩu khi bị yêu cầu.
- Vai `ADMIN` đăng nhập được. Workspace nghiệp vụ quản trị chưa mở.

## Kiểm thử

Lượt chuẩn bị phát hành chạy `npm test` trong `server/` trên các database `*_test`. Số pass, fail và thời gian nằm ở mục “Lượt chuẩn bị” bên dưới sau khi lệnh kết thúc. Lượt audit ngay trước đó, cùng cây nghiệp vụ, là 71 pass và 0 fail. Kết quả đó không phải nghiệm thu trình duyệt.

Web: `npm run lint`, `npx tsc -b`, `npm run build` thuộc cùng lượt chuẩn bị. Web không có test runner giao diện.

## Mức nghiệm thu

| Hạng mục | Trạng thái |
| --- | --- |
| Logistics code | Có |
| Automated API tests | Có, trên database tách biệt |
| FE-05A visual review | Đã xem các màn trong phạm vi. Chỉ bố cục trang chủ tài xế được chấp nhận |
| Logistics E2E | Chưa nghiệm thu |
| Mapbox tile và marker | Chưa kiểm chứng |
| Package Management | Chưa triển khai |
| Full Option B MVP | Chưa hoàn thành |
| FE-05B | Chưa bắt đầu. Bước tiếp theo, chưa làm trong bản này |
| Package Implementation | Bước tiếp theo theo phương án B. Chưa làm. Chưa có số gói, tên gói, giá, hạn mức, chu kỳ hay cách nâng hạ |

## Phương án B

Đã có mã logistics ở mức team testing. Phương án B còn bắt buộc Package Management, quyền gói và hạn mức trên backend. Các mục đó chưa triển khai. Không có tên gói, giá, hạn mức hay chu kỳ. Thanh toán online nằm sau MVP. Chi tiết cho người thử: [USER_GUIDE_BEGINNERS.md](../team-testing/USER_GUIDE_BEGINNERS.md).

Hướng dẫn người mới, viết sau lượt chuẩn bị phía dưới:

- [TEAM_TESTING_GUIDE.md](../team-testing/TEAM_TESTING_GUIDE.md)
- [USER_GUIDE_BEGINNERS.md](../team-testing/USER_GUIDE_BEGINNERS.md)
- [TROUBLESHOOTING.md](../team-testing/TROUBLESHOOTING.md)

Kịch bản đầu-cuối trong hướng dẫn sử dụng là quy trình để người thử tự bấm trên database dùng một lần. Chưa phải PASS.

## Lượt chuẩn bị

`npm test` trong `server/`: 71 pass, 0 fail, 0 skipped, `duration_ms` 64729.9884. Database là các tên `*_test`, không phải `coldi`.

`npm run lint`, `npm run typecheck` và `npm run build` trong `server/` chạy trong cùng lượt chuẩn bị.

Trong `web/`: `npx tsc -b` và `npm run build` thoát 0. Vite cảnh báo chunk lớn từ trước, khoảng 1.541 kB cho `index`. `npm run lint` chạy oxlint không báo lỗi trong cùng lượt.

Các lệnh này không phải nghiệm thu E2E và không chứng minh tile Mapbox.
