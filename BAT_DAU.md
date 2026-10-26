# Bắt đầu làm Move Truck Cold

Đọc file này trước. Kho dùng chung là [MMA301---Move-Truck-Cold](https://github.com/Van125478/MMA301---Move-Truck-Cold), nhánh `main`.

Bản này chạy trên máy từng người. Chưa phải bản thu tiền thật.

## Việc của từng thư mục

| Thư mục | Ai đụng | Việc |
| --- | --- | --- |
| `server` | Người làm API | Đăng nhập, đơn, sàn, GPS, và `/api/mobile` |
| `web` | Người làm website | Giao diện trình duyệt |
| `mobile` | Người làm app | Expo. Màn hình mới để trong `mobile/src`. Xem [mobile/README.md](mobile/README.md) |
| `docs` | Khi cần tra luật cũ | Không phải bước cài hôm nay |

Thư mục gốc không có `package.json`. Lệnh `npm` chạy trong `server`, `web`, hoặc `mobile`.

## 1. Máy cần có

- Git
- Node.js `>= 20.19.0`. Vite của website cần nhánh 20 từ `20.19.0`, hoặc Node `>= 22.12.0`
- npm
- Một MongoDB nghe `127.0.0.1:27017`, hoặc một cụm MongoDB Atlas

Kiểm tra:

```powershell
git --version
node --version
npm --version
```

## 2. Lấy mã

```powershell
git clone https://github.com/Van125478/MMA301---Move-Truck-Cold.git
cd MMA301---Move-Truck-Cold
git checkout main
git pull --ff-only
```

`git branch --show-current` phải in `main`.

## 3. Cài thư viện

`server` và `web` có lockfile. Dùng `npm ci`.

```powershell
cd server
npm ci
cd ..\web
npm ci
```

`mobile` chưa có lockfile. Đứng trong `mobile` rồi chạy `npm install`.

## 4. Nối MongoDB

API đọc một dòng trong `server\.env`:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/move_truck
```

Chuỗi phải bắt đầu bằng `mongodb://` hoặc `mongodb+srv://`.

Chỉ chạy **một** MongoDB trên cổng `27017`. Đừng bật MongoDB cài sẵn và container Docker cùng lúc.

### Máy đã có MongoDB

Mở `services.msc`, dịch vụ có chữ MongoDB phải đang Running. Rồi kiểm tra cổng:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

`TcpTestSucceeded : True` nghĩa là có chương trình đang nghe cổng. Bước health ở mục 6 mới xác nhận API nói chuyện được với MongoDB.

### Máy chưa có MongoDB

Cài Docker Desktop, mở đến khi engine chạy, rồi trong thư mục `server`:

```powershell
cd server
docker compose up -d
docker compose ps
```

File `server\docker-compose.yml` dùng image `mongo:7` và chỉ mở `127.0.0.1:27017`. Dữ liệu nằm trong volume `coldi-mongo`.

Tắt container mà giữ dữ liệu:

```powershell
docker compose stop
```

Nếu cổng `27017` đã có chương trình khác, đừng chạy `docker compose up`. Dùng MongoDB đang nghe cổng đó.

### MongoDB Atlas

Lấy connection string trên Atlas, dạng `mongodb+srv://...`. Dán vào `MONGODB_URI`. Thay mật khẩu người dùng Atlas. Trong Atlas, mở Network Access cho địa chỉ máy đang chạy API.

Tên database nằm ở cuối chuỗi, sau dấu `/` và trước dấu `?`. Ví dụ `...mongodb.net/move_truck?retryWrites=true&w=majority` dùng database `move_truck`.

Đừng commit chuỗi có mật khẩu.

### Tên database

`npm run seed:demo` từ chối database tên `coldi`, `admin`, `local`, hoặc `config`. File mẫu `.env.example` đang ghi database `coldi` để API chạy, nhưng lệnh tạo tài khoản demo sẽ dừng trên tên đó.

Dùng `move_truck` cho máy local:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/move_truck
```

API và lệnh seed phải cùng một `MONGODB_URI`. Đổi tên database là đổi chỗ lưu tài khoản và đơn.

## 5. File `server\.env`

Git không nhận file này.

```powershell
cd server
Copy-Item .env.example .env
```

Sửa các dòng bắt buộc:

```text
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/move_truck
FRONTEND_ORIGIN=http://127.0.0.1:5173
NODE_ENV=development
AUTH_SECRET=
```

`AUTH_SECRET` do mỗi người tự đặt, ít nhất 32 ký tự. Ô trống thì API không chạy.

`FRONTEND_ORIGIN` phải là `http://127.0.0.1:5173`. Mở web bằng `localhost` thì đăng nhập bị từ chối.

Muốn có bốn tài khoản demo, điền mật khẩu 8–72 ký tự cho bốn biến `DEMO_*_PASSWORD` trong cùng file `.env`. Giữ email mẫu. Đừng dán mật khẩu vào chat.

## 6. Chạy và kiểm tra MongoDB

Ba việc chạy riêng: MongoDB, API, website.

Cửa sổ API:

```powershell
cd server
npm run dev
```

Log cần có `MongoDB connected.` và `COLDI API listening on port 4000.`

Cửa sổ khác:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

Khi đã nối MongoDB, kết quả có `database : connected`.

Khi API chạy mà MongoDB tắt, health trả `database : unavailable`. Bật lại MongoDB, rồi xem cửa sổ API. Không cần tạo file `.env` lần nữa.

Cửa sổ website:

```powershell
cd web
npm run dev
```

Mở `http://127.0.0.1:5173`.

## 7. Tài khoản demo

Chỉ chạy trên database của máy mình, tên không phải `coldi`.

```powershell
cd server
npm run seed:demo
npm run seed:fleet
```

`seed:demo` tạo tài khoản còn thiếu. Tài khoản đã có thì giữ nguyên mật khẩu. `seed:fleet` chạy sau đó: gắn tài xế demo vào nhà xe demo và tạo một xe demo nếu chưa có.

| Email | Vai |
| --- | --- |
| `shipper.demo@coldi.local` | Chủ hàng |
| `carrier.demo@coldi.local` | Nhà xe |
| `driver.demo@coldi.local` | Tài xế |
| `admin.demo@coldi.local` | Quản trị |

Đăng nhập tại `http://127.0.0.1:5173/dang-nhap`. Đổi vai bằng cách đăng xuất rồi đăng nhập tài khoản kia.

## 8. Làm app mobile

Đọc [mobile/README.md](mobile/README.md) để biết màn hình để thư mục nào.

API cho app đã có, đăng nhập vẫn bằng cookie `coldi_session`:

- `GET /api/mobile/shipments`
- `GET /api/mobile/shipments/:id`
- `GET` và `POST /api/mobile/shipments/:id/reviews`
- `GET` và `POST /api/mobile/favorites`
- `DELETE /api/mobile/favorites/:shipmentId`
- `DELETE /api/mobile/favorites`

Nhà xe thấy đơn đang tìm xe. Chủ hàng chỉ thấy đơn của mình.

App chưa gọi các đường này. Người làm màn hình viết hàm trong `mobile/src/services/api`, rồi mới gắn vào màn hình.
