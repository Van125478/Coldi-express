# Move Truck Cold

Kho này dùng để làm backend và app mobile. Nhánh làm việc là `main`.

Người mới làm đúng thứ tự: lấy mã, nối MongoDB, chạy API, rồi mở app trong `mobile`.

## Thư mục

| Thư mục | Việc |
| --- | --- |
| `server` | API. Đăng nhập, đơn, và `/api/mobile` |
| `mobile` | App Expo. Màn hình mới để trong `mobile/src` |
| `web` | Website. Không cần mở nếu bạn chỉ làm app |

## 1. Lấy mã

Cần Git, Node.js `>= 20.19.0`, và npm.

```powershell
git clone https://github.com/Van125478/MMA301---Move-Truck-Cold.git
cd MMA301---Move-Truck-Cold
git checkout main
git pull --ff-only
```

Cài API:

```powershell
cd server
npm ci
```

## 2. Nối MongoDB

API đọc `MONGODB_URI` trong `server\.env`. Git không nhận file này.

```powershell
cd server
Copy-Item .env.example .env
```

Sửa thành:

```text
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/move_truck
FRONTEND_ORIGIN=http://127.0.0.1:5173
NODE_ENV=development
AUTH_SECRET=
```

`AUTH_SECRET` mỗi người tự đặt, ít nhất 32 ký tự.

Tên database dùng `move_truck`. `npm run seed:demo` từ chối database tên `coldi`, `admin`, `local`, hoặc `config`.

Chỉ một MongoDB nghe cổng `27017`.

MongoDB đã cài trên Windows: dịch vụ MongoDB phải đang chạy.

Chưa có MongoDB: mở Docker Desktop, rồi trong `server`:

```powershell
docker compose up -d
```

Image là `mongo:7`, cổng `127.0.0.1:27017`. Tắt mà giữ dữ liệu: `docker compose stop`.

MongoDB Atlas: dán chuỗi `mongodb+srv://...` vào `MONGODB_URI`, thay mật khẩu, và mở Network Access cho máy đang chạy API. Đừng commit chuỗi có mật khẩu.

Chạy API:

```powershell
cd server
npm run dev
```

Log cần có `MongoDB connected.` Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

`database : connected` là đã nối được.

Tài khoản thử. Điền mật khẩu 8–72 ký tự cho bốn biến `DEMO_*_PASSWORD` trong `.env`, rồi:

```powershell
cd server
npm run seed:demo
npm run seed:fleet
```

`npm run seed:demo` từ chối database tên `coldi`. Database local `coldi_demo_local` cần thêm `DEMO_CREDENTIAL_SYNC_DATABASE=coldi_demo_local` khi chạy lệnh seed tài khoản. Trên đúng database đó, `npm run seed:shipments` thêm đơn sàn, chuyến tài xế và một đánh giá mẫu.

| Email | Vai |
| --- | --- |
| `shipper.demo@coldi.local` | Chủ hàng |
| `carrier.demo@coldi.local` | Nhà xe |
| `driver.demo@coldi.local` | Tài xế |
| `admin.demo@coldi.local` | Quản trị |

## 3. Bắt đầu app mobile

```powershell
cd mobile
npm install
npm start
```

Cách bấm và nghiệm thu: [mobile/README.md](mobile/README.md), [mobile/DEMO.md](mobile/DEMO.md), [mobile/NGHIEM_THU.md](mobile/NGHIEM_THU.md).

App đã có trang trước đăng nhập, tab theo vai, tạo đơn, nhận chuyến, phân công, xác nhận lấy và giao, GPS tài xế, yêu thích trên máy, chuông thông báo, lọc nhóm nhiệt, sắp giá cao đến thấp, và đánh giá trên chi tiết đơn.
