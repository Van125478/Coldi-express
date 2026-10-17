# MVP-01 — Khoảng trống tích hợp

> Historical Snapshot. Các câu bên dưới về README, `feature/cinematic-scroll` và `main` chỉ có commit khởi tạo là trạng thái lúc rà soát. Hướng dẫn hiện hành là [Team Testing Guide](../team-testing/TEAM_TESTING_GUIDE.md). Trạng thái mới nằm ở [MVP_STATUS_2026-10-18.md](MVP_STATUS_2026-10-18.md).

Rà trên mã đang có trong cây làm việc lúc viết file. Không suy ra từ báo cáo Core 13 nếu chưa thấy trong file.

## Năm chỗ Core 13 nói đã nối lại

| Chỗ | Kết quả kiểm mã | Bằng chứng |
| --- | --- | --- |
| Chủ hàng đọc GPS | Có | `server/src/routes/shipment.routes.ts` `GET /:id/location`, khoảng dòng 65–80. Chủ đơn nhận tracking. Chủ hàng khác nhận 403. Router đã khóa `requireRole("SHIPPER")` nên carrier và admin không vào route này. |
| Hàm gán xe phía client | Có | `web/src/services/shipmentService.ts` `assignShipment`, khoảng dòng 146. `ClaimedShipments.tsx` gọi hàm đó. |
| AppProviders | Có | `web/src/main.tsx` bọc `RouterProvider` bằng `AppProviders`. `AppProviders.tsx` bọc `AuthProvider`. |
| Lối Đội xe | Có | `web/src/components/layout/WorkspaceLayout.tsx` mục CARRIER có `/carrier/doi-xe`, icon `Container`. |
| Panel vị trí tài xế | Có | `web/src/features/workspace/driver/DriverTripDetail.tsx` render `DriverLocationShare` khi `status === "IN_TRANSIT"`. |

Năm chỗ này có trong mã. Chưa có nghiệm thu tay sau khi nối.

## Chuỗi 19 bước

| Bước | Quyền | API | UI | Trạng thái lưu | Lỗi và thử lại | Kết luận |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Chủ hàng đăng nhập | SHIPPER | `POST /api/auth/login` | `/dang-nhap` | Cookie phiên | Sai mật khẩu cùng thông báo với email lạ | API đã test. UI chưa rà lại đợt này |
| 2. Tạo đơn | SHIPPER, Origin tin cậy | `POST /api/shipments` | `/shipper/tao-don` | PUBLISHED ngay | 400 khi thiếu trường | Đã test |
| 3. PUBLISHED | Chính chủ hàng | Cùng request tạo | Nhãn “Đang tìm xe” | Event PUBLISHED trong cùng document | Không có nháp | Đã test |
| 4. Nhà xe thấy đơn | CARRIER | `GET /api/carrier/shipments` | `/carrier` và `/carrier/tim-chuyen` | Không đổi đơn | 401/403 đúng vai | Đã test |
| 5. Tìm, lọc, so sánh | CARRIER | Query allowlist | Form trên sàn; so sánh chỉ ở client | Không đổi đơn | 400 khi tham số lạ hoặc khoảng ngược | API đã test. So sánh chưa test |
| 6. Chat | Đúng nhà xe hoặc đúng chủ đơn | `POST /api/carrier/conversations/by-shipment/:id` | `CarrierChat` trên chi tiết | Conversation riêng. Không đổi status | Nhà xe thua không ghi tiếp | API đã test. UX poll chưa test |
| 7. Claim tường minh | CARRIER | `POST .../claim` chỉ sau nút xác nhận | `ClaimConfirm` | MATCHED, `carrierId` phiên | 409 khi thua | API đã test. Popup chưa test |
| 8. MATCHED | Nhà xe thắng và chủ hàng | GET chi tiết | Nhãn chưa gán: “Đã có nhà xe nhận chuyến” | Một carrier | Claim lặp 409 | Đã test |
| 9. Chọn xe đủ điều kiện | CARRIER thắng, xe của mình | Kiểm tra trong assign | Select ở “Chuyến của tôi” | Chưa ghi cho đến khi gán | Xe người khác: 400 | Đã test |
| 10. Gán tài xế đã gắn nhà xe | DRIVER có `carrierId` trùng | `POST .../assign` | Cùng màn | Vẫn MATCHED, nhãn “Chờ lấy hàng” | Hai request gán: một cặp thắng | Đã test |
| 11. Tài xế thấy chuyến | DRIVER được gán | `GET /api/driver/shipments` | `/driver` | Không thấy chuyến người khác | 403/404 theo route | Đã test |
| 12. Xác nhận lấy | DRIVER được gán, còn MATCHED | `POST .../pickup` | Nút rồi panel xác nhận | Status IN_TRANSIT, event PICKUP_CONFIRMED | Lặp trả 200, không thêm event | Đã test |
| 13. IN_TRANSIT | Như trên | Như trên | Nhãn “Đang vận chuyển” | GPS không tự bật trạng thái | Chưa lấy thì không nhận tọa độ | Đã test |
| 14. Báo vị trí | DRIVER được gán, status IN_TRANSIT | `POST /api/driver/shipments/:id/location` | `DriverLocationShare` | `latestLocation` một điểm, không lịch sử | Mẫu cũ 409 | API đã test. Trình duyệt chưa |
| 15. Chủ hàng xem | SHIPPER sở hữu đơn | `GET /api/shipments/:id/location` | `ShipmentLocation` poll 90 giây | Không ghi thêm | Người khác 403 | API đã test. UI chưa |
| 16. Xác nhận giao | DRIVER, đang IN_TRANSIT | `POST .../delivery` | Nút tường minh | DELIVERY_CONFIRMED | Lặp 200, không thêm event | Đã test |
| 17. Không sang COMPLETED | Không có transition | Không | Copy nói chưa phải thanh toán | Dừng ở DELIVERY_CONFIRMED | — | Đúng phạm vi đã chốt |
| 18. Timeline | Người có quyền xem đơn | Gắn lúc đọc | `ShipmentTimeline` | Event trong document đơn | GET không ghi | Đã test. Lần gán mới giữ tên lúc gán; xem `08-timeline-history-fix.md` |
| 19. Audit | Sau ghi thành công | `recordSuccessfulAudit` | Không có màn | Collection `AuditLog` | Insert lỗi thì nghiệp vụ vẫn 200 | Đã test một lần. Chưa test mất log |

Không thấy bước nào trong chuỗi 19 bị thiếu endpoint. Bản đồ địa lý dùng GET vị trí đã có; tile Mapbox chưa được bấm, xem mục GPS bên dưới. Các bước UI từ chat, popup Claim, đội xe, GPS trình duyệt chưa được người dùng bấm trong đợt này.

## Core theo mã

### Core 04 — Claim

`carrierShipment.routes.ts` cập nhật bằng điều kiện `status: PUBLISHED` và `carrierId` null hoặc chưa tồn tại. Thua trả 409, không ghi audit thắng lần hai. Test tranh chấp nằm ở `claim.test.ts`, `security.test.ts` và `marketplace.test.ts`.

### Core 05 — Assignment

Assign kiểm tra xe và tài xế thuộc đúng `carrierId` trước, rồi mới cập nhật đơn của nhà xe thắng. Tài xế chưa gắn nhà xe không được chọn. Không có tự gán.

### Core 06 — Mốc tài xế

Pickup và delivery là POST có phiên, có Origin, có body cấm `driverId` giả. GPS không nằm trong điều kiện chuyển trạng thái.

### Core 07 — Timeline

Event hợp lệ vẫn là năm loại ở `shipmentEventTypes`. Đoạn dưới đây mô tả mã trước MVP-03: câu `ASSIGNED` chỉ ghép tên đang có trong collection.

MVP-03 đã ghi `assignedVehicleLabel` và `assignedDriverName` trong cùng lần gán. Lúc đọc, hai field đó được dùng trước. Event không có chúng vẫn tra cứu hiện tại. Không migration. Chi tiết ở `08-timeline-history-fix.md`.

### Core 08 — Cài đặt

`docs/core-08/01-thiet-lap.md` khớp biến `PORT`, `MONGODB_URI`, `FRONTEND_ORIGIN`, `NODE_ENV`, `AUTH_SECRET` và cảnh báo seed ghi đè `passwordHash` cùng `role` của bốn email demo. `docs/core-08/04-su-co-va-gioi-han.md` nói seed không xóa đơn.

README gốc và `server/README.md` dừng ở ảnh Core 08: chúng nói GPS, chat và đội xe chưa có. Câu đó đúng với commit, sai với cây chưa commit. Hướng dẫn clone `feature/cinematic-scroll` hôm nay không kéo theo Core 09–13.

`origin/main` cục bộ vẫn là `44e4791134690c72a261d91c60388994668fcdcb`. Đợt này không fetch. Mọi nhận định về GitHub `main` xa hơn ref cục bộ là UNVERIFIED.

### Core 09 — GPS

Backend vị trí chạy và đã được test: chỉ IN_TRANSIT, đúng tài xế, một `latestLocation`, chủ hàng đọc của mình, sàn không có tọa độ.

MVP-04 gắn Mapbox GL JS 3.33.0 cho chủ hàng khi có token `pk.` và bấm mở bản đồ. Tile thật chưa được bấm. Phase `stale` có trong DTO. Ping gần kho không chạy vì địa chỉ kho là chữ. Chia sẻ trình duyệt dừng khi rời trang; đó là giới hạn đã ghi trong policy, chưa được bấm thử. Không có retention lịch sử vì không lưu lịch sử.

### Core 10 — Chat

Một conversation cho một cặp `shipmentId` + `carrierId`, unique index. Chủ hàng chỉ vào hội thoại của đơn mình. `chatAccess.ts` ghi rõ quy tắc tạm: còn ghi được khi đơn PUBLISHED chưa có nhà xe, hoặc đúng nhà xe đã thắng. Nhà xe thua không ghi thêm. Test chat kiểm tra hai thread riêng và chat không đổi giá, không Claim.

Chưa có retention, chưa có rate limit. Poll 5 giây là hành vi UI, chưa có test trình duyệt. `ChatThread` reset theo `threadKey` và `writable`. Không có test component.

Quy tắc nhà xe thua vẫn đọc thread cũ là provisional. Không được ghi nhận là chính sách cuối.

### Core 11 — Fleet

Xe tạo và sửa theo chủ. Tài xế có roster và sửa `displayName`. Gán dùng đúng xe và tài xế đã liên kết. Xe seed chỉ có nhãn vẫn gán được. Không có xóa xe, không có tạo user tài xế, không có đăng kiểm chặn gán. D-07 vẫn là đề xuất.

### FE-01

Tailwind v4 nằm ở `web/src/styles/global.css`. shadcn đang dùng Button, Input, Label, Badge, Card trong `web/src/shared/components/ui`. `components.json` trỏ UI về đó. Feature folder có fleet, chat, gps, shipments. Route nghiệp vụ vẫn đi qua `RoleGate`. CSS cinematic cũ vẫn nằm trong `global.css`.

Build web gần nhất báo một chunk khoảng 1.507 kB, gzip khoảng 413 kB. Ảnh là bundle lớn vì gộp landing, GSAP và workspace. Với demo local, thời gian tải lần đầu tăng. Không làm hỏng nghiệp vụ. Chưa cần tách chunk trong đợt đóng chức năng. Không đề xuất NestJS, TanStack Query, Zustand hay Zod.

`/illustration-lab` đang là route công khai trong `router.tsx`. Nó là đồ thí nghiệm local, không thuộc MVP. Không nên đi theo bản đồng đội nếu chưa được yêu cầu.

### Core 12

Cách ly đang test được: chủ hàng khác không đọc đơn, nhà xe khác không sửa xe, tài xế không thấy chuyến người khác, GPS và chat không lộ sang người ngoài. Đó là quan hệ nghiệp vụ, không phải Organization.

Audit ghi sau khi ghi nghiệp vụ thành công. Không có `tenant_id`. Không có API đọc audit. Lỗi ghi audit không làm fail phản hồi nghiệp vụ.

### Core 13

Tìm, lọc, sắp xếp đã có test API. So sánh và popup Claim chỉ có ở client. DTO sàn không có email tài khoản, `shipperId`, GPS. Giới hạn 500/100 là thật trong `carrierShipment.routes.ts`. Chưa phân trang. Tìm không dấu cố ý không có, và đã có test chứng minh `thuy san` không khớp `Thủy sản`. UI 390px chưa đo.

Với dữ liệu pilot từng đơn, 500/100 và tìm có dấu không chặn phát hành nội bộ. Chúng là P2. Popup Claim và so sánh cần nghiệm thu tay trước khi gọi sàn là đã chấp nhận.

## Việc không được tự động

Đã kiểm trong route: không có auto-claim, không có auto-assign, pickup/delivery không đọc GPS để đổi trạng thái, không có bước sang COMPLETED, không có ghi thanh toán.
