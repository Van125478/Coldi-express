# Thiết lập COLDI trên một máy

Mỗi người chạy một bản trên máy của mình. Dữ liệu tạo trên máy này không xuất hiện trên máy người khác. Cách dùng chung một máy chủ chưa có. Xem [giới hạn nhiều máy](04-su-co-va-gioi-han.md).

## A. Phần cần cài

| Công cụ | Yêu cầu lấy từ kho mã | Ghi chú |
| --- | --- | --- |
| Git | Cần để clone | Remote: `https://github.com/Van125478/Coldi-express` |
| Node.js | `server/package.json` yêu cầu `>=20.19.0`. Vite 8 đang cài yêu cầu `^20.19.0` hoặc `>=22.12.0` | Dùng một bản Node thỏa cả hai |
| npm | Đi kèm Node | Cài `server` và `web` bằng npm. Không trộn pnpm vào `node_modules` đã cài bằng npm |
| MongoDB | `server/docker-compose.yml` dùng image `mongo:7`, cổng `127.0.0.1:27017` | Docker không bắt buộc nếu MongoDB đã nghe đúng cổng đó |
| Trình duyệt | Chrome hoặc Edge bản mới | Mở `http://127.0.0.1:5173`, không mở `http://localhost:5173` |

Kho mã không ghi một tên Windows Service cố định cho MongoDB. Nếu MongoDB cài bằng bộ cài Windows, tên dịch vụ phụ thuộc máy. Kiểm tra bằng lệnh ở mục xử lý sự cố, không đoán tên dịch vụ.

## B. Clone và cài gói

Remote là `https://github.com/Van125478/Coldi-express`. Khi Core 07 và Core 08 đã được merge, clone rồi dùng `main`. Việc merge đó chưa xảy ra. `main` hiện chỉ có commit khởi tạo `44e4791134690c72a261d91c60388994668fcdcb`, nên clone `main` hôm nay không chạy được luồng đơn.

Timeline nằm ở commit `cd5045300ac4c788deba3c08053ed1a439481d95` trên `feature/cinematic-scroll`. `npm test` của commit đó có `tests/timeline.test.ts`. Nhánh này chưa phải bản `main`. Đừng gắn nó thành hướng dẫn cố định. Sau merge, bỏ lệnh checkout bên dưới và ở lại `main`. Hash merge sẽ được điền khi nó tồn tại.

PowerShell, chỉ để xem nhánh làm việc trước khi có bản `main`:

```powershell
git clone https://github.com/Van125478/Coldi-express.git
cd Coldi-express
git checkout feature/cinematic-scroll
cd server
npm install
cd ..\web
npm install
```

Thư mục clone là `Coldi-express`. Bản đang làm việc có thể nằm ở `C:\Coldi`. Hai đường dẫn đó chỉ khác tên thư mục. Máy clone `main` chưa có timeline. Máy theo nhánh ở lệnh trên có timeline kể từ commit `cd5045300ac4c788deba3c08053ed1a439481d95`.

Không có `package.json` ở thư mục gốc. `npm install` ở gốc sẽ thất bại.

## C. Biến môi trường

Trong `server`:

```powershell
copy .env.example .env
```

Mở `server/.env` bằng trình soạn thảo. Điền giá trị local. Không commit file này. `.env` đã được `server/.gitignore` bỏ qua.

Các biến bắt buộc, đúng tên trong `server/src/config/env.ts` và `server/.env.example`:

```text
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/coldi
FRONTEND_ORIGIN=http://127.0.0.1:5173
NODE_ENV=development
AUTH_SECRET=<chuỗi-bí-mật-ít-nhất-32-ký-tự>
```

`AUTH_SECRET` do mỗi máy tự đặt. Dài ít nhất 32 ký tự. Không gửi chuỗi này vào chat, tài liệu hay Git.

`FRONTEND_ORIGIN` phải đúng `http://127.0.0.1:5173`. Giá trị `*` bị từ chối. `http://localhost:5173` là một nguồn khác, nên đăng nhập từ trang localhost trả `403` với mã `invalid_origin`.

Bốn tài khoản demo đọc thêm các biến sau. Email gợi ý đã có trong `.env.example`. Mật khẩu để trống trong file mẫu và phải tự điền:

```text
DEMO_SHIPPER_EMAIL=shipper.demo@coldi.local
DEMO_SHIPPER_PASSWORD=<mật-khẩu-local-8-đến-72-ký-tự>
DEMO_CARRIER_EMAIL=carrier.demo@coldi.local
DEMO_CARRIER_PASSWORD=<mật-khẩu-local-8-đến-72-ký-tự>
DEMO_DRIVER_EMAIL=driver.demo@coldi.local
DEMO_DRIVER_PASSWORD=<mật-khẩu-local-8-đến-72-ký-tự>
DEMO_ADMIN_EMAIL=admin.demo@coldi.local
DEMO_ADMIN_PASSWORD=<mật-khẩu-local-8-đến-72-ký-tự>
```

Bốn mật khẩu không cần giống nhau. Mỗi mật khẩu dài từ 8 đến 72 ký tự. Script seed từ chối giá trị ngoài khoảng đó và không in mật khẩu ra màn hình.

Frontend không cần file `.env` cho demo local. `web/src/services/apiClient.ts` gọi `http://127.0.0.1:4000` khi không có `VITE_API_ORIGIN`.

Không chép `server/.env` của máy khác vào tài liệu hoặc vào Git.

## D. Tạo tài khoản demo

Các lệnh dưới đây có trong commit đã đẩy. Chạy tại thư mục `server`, sau khi MongoDB đã chạy và `.env` đã điền.

```powershell
npm run seed:demo
npm run seed:fleet
```

`npm run seed:demo` tạo hoặc cập nhật bốn tài khoản theo email:

| Email | Vai trò | Việc tài khoản này làm được |
| --- | --- | --- |
| `shipper.demo@coldi.local` | SHIPPER | Đăng đơn và xem đơn của mình |
| `carrier.demo@coldi.local` | CARRIER | Xem đơn đang tìm xe, nhận chuyến, phân công |
| `driver.demo@coldi.local` | DRIVER | Chỉ thấy chuyến đã được nhà xe này phân công |
| `admin.demo@coldi.local` | ADMIN | Vào trang nói rằng khu quản trị chưa mở |

Script từ chối chạy khi `NODE_ENV=production`. Chạy lại không tạo tài khoản trùng email. Nó ghi lại mật khẩu đã băm và vai trò của đúng bốn email đó. Nó không xóa đơn hàng. Nó cũng không gắn tài xế vào nhà xe.

`npm run seed:fleet` phải chạy sau `seed:demo`. Script tìm nhà xe và tài xế theo `DEMO_CARRIER_EMAIL` và `DEMO_DRIVER_EMAIL`. Nếu thiếu một trong hai, script dừng. Nếu tài xế đã gắn với một nhà xe khác, script dừng và không đổi mối liên kết. Nếu được, script gắn tài xế với nhà xe demo, đặt tên hiển thị `Tài xế demo` khi tài xế chưa có tên, và tạo một xe nhãn `Xe đông lạnh demo Core 05` nếu xe đó chưa có.

Trang `/dang-ky` không tạo tài khoản. Bấm đăng ký chỉ hiện thông báo rằng không có tài khoản nào được tạo.

Lệnh `npm run reset:demo-passwords` không nằm trong commit đã đẩy. Đừng viết lệnh này vào hướng dẫn clone. Máy đang có file local `server/src/scripts/resetDemoPasswords.ts` cũng không cần chạy lại lệnh đó.

## E. Khởi động

Ba tiến trình, ba cửa sổ.

1. MongoDB nghe `127.0.0.1:27017`.

Nếu dùng Docker, tại thư mục `server`:

```powershell
docker compose up -d
```

File compose chỉ xuất cổng ra `127.0.0.1` và không đặt mật khẩu cơ sở dữ liệu. File không khai báo `restart`, nên sau khi khởi động lại Windows có thể cần chạy lại lệnh này.

2. API, tại thư mục `server`:

```powershell
npm run dev
```

Khi nối được MongoDB, log có `MongoDB connected.` và `COLDI API listening on port 4000.`

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

Kết quả đúng:

```json
{
  "status": "ok",
  "service": "coldi-api",
  "database": "connected"
}
```

Nếu MongoDB chưa chạy, tiến trình API vẫn mở và health trả HTTP 503, `status` là `degraded`, `database` là `unavailable`.

3. Giao diện, tại thư mục `web`:

```powershell
npm run dev
```

Vite in `Local: http://127.0.0.1:5173/`. Cả `web/vite.config.js` và `web/vite.config.ts` đều khóa `host` `127.0.0.1`, cổng `5173`, `strictPort: true`. Vite đọc file `.js` trước. Nếu 5173 đang bị chiếm, Vite dừng, không tự chuyển sang 5174.

Mở `http://127.0.0.1:5173/dang-nhap`.

Dùng `127.0.0.1` chứ không dùng `localhost`. Trên Windows, `localhost` có thể phân giải ra IPv6 trước. Cookie phiên và CORS được cấp cho `http://127.0.0.1:5173`. Trang mở bằng localhost là một nguồn khác, nên đăng nhập bị từ chối với `invalid_origin`.

## F. Dừng và chạy lại

Dừng API hoặc Vite trong đúng cửa sổ đang chạy lệnh đó: nhấn `Ctrl+C`. API còn xử lý tín hiệu tắt và đóng kết nối MongoDB. Không dùng lệnh tắt mọi tiến trình `node.exe`, vì máy có thể đang chạy việc khác.

Sau khi khởi động lại Windows:

1. Bật lại MongoDB bằng dịch vụ đã cài, hoặc `docker compose up -d` trong `server`.
2. `npm run dev` trong `server`.
3. `npm run dev` trong `web`.
4. Mở lại `http://127.0.0.1:5173`.

Đăng nhập lại nếu cookie phiên đã mất. Phiên cookie `coldi_session` sống 12 giờ, `HttpOnly`, `SameSite=Lax`.

## G. Đăng nhập

Mỗi vai trò đăng nhập riêng. Muốn đổi vai trò, bấm `Đăng xuất` rồi đăng nhập tài khoản kia. Không có nút đổi vai trò trong một phiên.

Sau đăng nhập:

| Vai trò | Trang đầu |
| --- | --- |
| SHIPPER | `/shipper` |
| CARRIER | `/carrier` |
| DRIVER | `/driver` |
| ADMIN | `/admin` |

Menu chủ hàng: Tổng quan, Tạo đơn, Đơn của tôi. Menu nhà xe: Tổng quan, Tìm chuyến, Chuyến của tôi. Menu tài xế: Trang chủ, Chuyến của tôi. Quản trị chỉ có một trang báo khu vận hành chưa mở.

Sai email hoặc sai mật khẩu cùng một câu: `Email hoặc mật khẩu không đúng.`
