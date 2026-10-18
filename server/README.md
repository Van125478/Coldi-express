# COLDI API

API Node.js cho bản team testing trên máy local. Không phải production. Không phải MVP đã hoàn thành. Module gói có danh mục, quyền gói và kích hoạt Demo/QA. Chưa có sổ hoa hồng, báo cáo sự cố, giá dầu hay thanh toán thật.

Người mới cài máy theo [hướng dẫn nhóm](../docs/team-testing/TEAM_TESTING_GUIDE.md). File này giải thích API. SHA hiện tại lấy bằng `git rev-parse HEAD` sau `git pull`. Đừng dùng SHA cũ trong mục lịch sử làm HEAD.

Cookie phiên tên `coldi_session`. Chủ hàng đăng đơn. Nhà xe tìm đơn đang mở, nhận một đơn, phân công xe và tài xế thuộc nhà xe đó. Tài xế được gán xác nhận lấy, gửi một điểm GPS khi `IN_TRANSIT`, rồi xác nhận giao. Chủ hàng đọc điểm của đơn mình. Nhà xe đã nhận đọc điểm qua API riêng. Chat không nhận chuyến và không đổi giá niêm yết.

## Máy cần có

- Node.js `>= 20.19.0`, đúng `engines` trong `package.json`
- npm
- MongoDB tại URI trong `.env`

Docker không bắt buộc. MongoDB sẵn trên `127.0.0.1:27017` là đủ. Nếu dùng Docker, file `docker-compose.yml` chạy image `mongo:7`, cổng chỉ `127.0.0.1:27017`, volume `coldi-mongo`. Đừng bật Docker khi cổng 27017 đã có MongoDB. `docker compose stop` tắt container và giữ volume. Hướng dẫn này không bảo xóa volume.

## Cài và chạy

Thư mục này là `server`, không phải thư mục gốc của kho.

```powershell
cd server
npm ci
Copy-Item .env.example .env
npm run dev
```

Sửa `.env` trước `npm run dev`. Biến bắt buộc, kiểm tra trong `src/config/env.ts`:

| Biến | Ràng buộc |
| --- | --- |
| `PORT` | Số nguyên 1–65535. Local: `4000` |
| `MONGODB_URI` | Bắt đầu bằng `mongodb://` hoặc `mongodb+srv://` |
| `FRONTEND_ORIGIN` | URL http hoặc https, không được `*` |
| `NODE_ENV` | `development`, `test`, hoặc `production` |
| `AUTH_SECRET` | Ít nhất 32 ký tự |
| `APP_RUNTIME_MODE` | Không bắt buộc. Mặc định `development`, hoặc `production` khi `NODE_ENV=production`. `qa` và `demo` không được dùng khi process là production |
| `PACKAGE_DEMO_SELF_ACTIVATION_ENABLED` | Mặc định tắt. Bật chỉ khi mode là `qa` hoặc `demo`, hai mã triển khai khớp nhau, và tên database chứa `test`, `qa` hoặc `demo` |
| `PACKAGE_DEMO_DEPLOYMENT_ID` | Mã triển khai Demo/QA, ít nhất 8 ký tự, phải trùng mã được cấp phép |
| `PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID` | Mã được cấp phép, đặt riêng với mã triển khai. Một biến boolean không đủ để biến production thành demo |

`NODE_ENV` không tự bật kích hoạt gói. Production mà bật cờ demo, hoặc đặt mode `qa`/`demo`, sẽ dừng lúc khởi động. Database `coldi` không được dùng cho kích hoạt demo. Trần xe dùng bộ đếm nguyên tử trên một document. Thao tác này không phải transaction nhiều collection; replica set không được giả định.

Thiếu biến thì API không lên, báo `Missing required environment variable`. `AUTH_SECRET` ngắn hơn 32 ký tự báo `AUTH_SECRET must be at least 32 characters.`

`FRONTEND_ORIGIN` local là `http://127.0.0.1:5173`. Trang mở bằng `localhost` là nguồn khác, đăng nhập trả 403 `invalid_origin`.

## Lệnh trong package.json đã commit

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | API tự tải lại khi sửa mã |
| `npm run typecheck` | Kiểm tra kiểu, không ghi `dist` |
| `npm run lint` | oxlint `src` và `tests` |
| `npm test` | Các file test kể tên trong `package.json`, lần lượt |
| `npm run build` | Biên TypeScript ra `dist` |
| `npm start` | Chạy bản đã build |
| `npm run seed:demo` | Tạo hoặc cập nhật bốn tài khoản demo |
| `npm run seed:fleet` | Gắn tài xế demo với nhà xe demo, tạo một xe demo nếu chưa có |

`npm test` đổi tên database sang các tên `*_test` và từ chối nếu tên nối không khớp. Không xóa database `coldi`. Không seed trong test.

`npm run seed:demo` ghi lại `passwordHash` và `role` của bốn email demo. Chỉ dùng database mới hoặc database dùng một lần. Không xóa đơn. Từ chối khi `NODE_ENV=production`. `seed:fleet` chạy sau đó. Bản đã commit không có lệnh đặt lại mật khẩu demo.

Kết quả test của lượt chuẩn bị trước tài liệu người mới nằm ở `docs/mvp-review/MVP_STATUS_2026-10-18.md`. Số đó không phải nghiệm thu trình duyệt.

## Health

`GET /api/health`

MongoDB đã nối, HTTP 200:

```json
{
  "status": "ok",
  "service": "coldi-api",
  "database": "connected"
}
```

API sống nhưng MongoDB chưa nối, HTTP 503:

```json
{
  "status": "degraded",
  "service": "coldi-api",
  "database": "unavailable"
}
```

Câu trả lời không chứa URI.

## Đăng nhập

Cookie `coldi_session`, 12 giờ, `HttpOnly`, `SameSite=Lax`, `Secure` chỉ khi `NODE_ENV=production`. Bí mật ký là `AUTH_SECRET`. Token không nằm trong `localStorage`.

| Phương thức | Đường dẫn | Kết quả |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Đặt cookie. Trả `user` gồm `id`, `email`, `role`, `accountStatus`, `mustChangePassword` |
| `GET` | `/api/auth/me` | Cùng dạng user, hoặc 401 |
| `POST` | `/api/auth/change-required-password` | Đổi mật khẩu tạm khi đang bị yêu cầu, rồi cấp cookie mới |
| `POST` | `/api/auth/logout` | Xóa cookie |

Sai email hoặc sai mật khẩu: 401, câu `Email hoặc mật khẩu không đúng.` Đúng mật khẩu nhưng tài khoản khóa: 403 `account_locked`, không đặt cookie. Vai gửi từ client bị bỏ qua. Khóa, đặt lại mật khẩu và đổi mật khẩu bắt buộc tăng phiên bản phiên, cookie cũ hết hiệu lực.

Bốn email gợi ý: `shipper.demo@coldi.local`, `carrier.demo@coldi.local`, `driver.demo@coldi.local`, `admin.demo@coldi.local`. Mật khẩu chỉ ở `.env`.

Chưa có giới hạn số lần đăng nhập. Chưa đủ cho production.

## Đơn và nhà xe

| Phương thức | Đường dẫn | Ai |
| --- | --- | --- |
| `POST` | `/api/shipments` | SHIPPER đang đăng nhập. Tạo `PUBLISHED`. `shipperId` lấy từ phiên |
| `GET` | `/api/shipments/mine` | Đơn của chủ hàng đó |
| `GET` | `/api/shipments/:id` | Chủ hàng sở hữu đơn |
| `GET` | `/api/shipments/:id/location` | Đúng chủ hàng. Chủ hàng khác: 403 |
| `GET` | `/api/carrier/shipments` | CARRIER, đơn đang mở. Quét tối đa 500, trả tối đa 100 |
| `POST` | `/api/carrier/shipments/:id/claim` | Một nhà xe thắng. Nhà xe thứ hai: 409 |
| `GET` | `/api/carrier/shipments/claimed` | Chuyến nhà xe đã nhận |
| `POST` | `/api/carrier/shipments/:id/assign` | Xe và tài xế thuộc nhà xe, đơn `MATCHED` chưa gán. Lần hai: 409 |
| `GET` | `/api/carrier/shipments/:id/location` | Đúng `shipment.carrierId`. Sai hoặc không có: 404 |

Giá lưu là số nguyên đồng, `listedPriceVnd`, chưa phải thanh toán. Nhãn `PUBLISHED` là “Đang tìm xe”. `MATCHED` chưa gán là “Đã có nhà xe nhận chuyến”. Đã gán xe và tài xế thì nhãn vận hành “Chờ lấy hàng”, mã trạng thái vẫn `MATCHED`.

Chat nhà xe: `POST /api/carrier/conversations/by-shipment/:shipmentId` mở cuộc. Tin nằm dưới `/api/carrier/conversations/:conversationId/messages`. Chat chủ hàng nằm dưới `/api/shipments/:id/conversations`. Gửi tin không claim.

Đội xe, vai CARRIER: `GET` và `POST /api/carrier/fleet/vehicles`, `GET` và `PATCH /api/carrier/fleet/vehicles/:id`. Không có xóa xe. Tài xế: `GET` và `POST /api/carrier/fleet/drivers`, `PATCH /api/carrier/fleet/drivers/:id` sửa tên, `POST .../lock`, `.../unlock`, `.../reset-password`. Quy tắc Core 14 nằm ở `docs/core-14/01-driver-account-management.md`. Mật khẩu tạm trả một lần. Khóa và đặt lại mật khẩu bị chặn khi tài xế còn chuyến `MATCHED` hoặc `IN_TRANSIT`.

## Tài xế

| Phương thức | Đường dẫn | Kết quả |
| --- | --- | --- |
| `GET` | `/api/driver/shipments` | Chuyến đã gán cho tài xế này và đã có xe |
| `GET` | `/api/driver/shipments/:id` | Một chuyến đó, hoặc 404 |
| `POST` | `/api/driver/shipments/:id/pickup` | Từ `MATCHED` đã gán sang `IN_TRANSIT` |
| `POST` | `/api/driver/shipments/:id/delivery` | Từ `IN_TRANSIT` sang `DELIVERY_CONFIRMED` |
| `POST` | `/api/driver/shipments/:id/location` | Gửi điểm chỉ khi đang `IN_TRANSIT` và đúng tài xế |
| `GET` | `/api/driver/shipments/:id/location` | Tài xế đọc điểm của chuyến mình |

Xác nhận lần hai không kéo trạng thái lùi. Giao không sang `COMPLETED` và không ghi thanh toán. GPS không đổi trạng thái và không thêm mốc timeline.

Sự kiện timeline: `PUBLISHED`, `CLAIMED`, `ASSIGNED`, `PICKUP_CONFIRMED`, `DELIVERY_CONFIRMED`. `ASSIGNED` mới lưu tên xe và tên tài xế lúc gán. Sự kiện cũ không có hai trường đó vẫn đọc được và dùng tên hiện tại, nên câu đó không phải ảnh lịch sử bất biến.

ADMIN không có router nghiệp vụ. Khách 401. Sai vai 403 trên route yêu cầu vai.

## Việc còn mở

Một nhà xe nhận một đơn. Nhận chuyến không gán xe. Chat không giữ chỗ. Tile Mapbox chưa được chứng minh khi render thật. Thời gian lưu tin và quyền đọc của nhà xe thua claim chưa chốt. Không có tenant tổ chức. Audit ghi sau khi nghiệp vụ thành công và có thể mất nếu tiến trình dừng trước insert. Không có gói dịch vụ, hạn mức, hay thanh toán.

## Lịch sử

Timeline bắt đầu ở commit `cd5045300ac4c788deba3c08053ed1a439481d95`. Core 08 từng gắn với `69ec1a198f0729efc10a3d534dd92d264b1738eb`. Hai mã đó không phải HEAD bản team testing hôm nay.
