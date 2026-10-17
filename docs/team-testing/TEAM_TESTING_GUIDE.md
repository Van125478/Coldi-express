# Hướng dẫn kiểm thử COLDI cho nhóm

Bản này là **WIP / Team Testing**. Không phải bản phát hành. Giao diện chưa được nghiệm thu cuối.

Ngày ghi hướng dẫn: 17/10/2026.

Nhánh kiểm thử: `main`.

Commit trên nhánh tích hợp chứa mã ứng dụng và bản hướng dẫn này: `bdff152aa9fe9f40e6f1dc5f2ebeb62237107c76`.

Sau khi `git pull` trên `main`, chạy:

```powershell
git rev-parse HEAD
```

Ghi đúng SHA đó vào mỗi báo lỗi. SHA trên `main` là commit merge, có thể khác SHA của từng commit trên nhánh tích hợp.

## A. Bản đang thử

Đã có trong mã, để nhóm bấm và tìm lỗi:

- Trang khách: trang chủ điện ảnh, giải pháp chủ hàng, giải pháp nhà xe, về COLDI, đăng nhập.
- Chủ hàng: đăng nhập, tạo đơn, danh sách đơn, chi tiết, trạng thái và timeline.
- Nhà xe: trang chủ, sàn `/carrier/tim-chuyen`, tìm và lọc, nhận chuyến thủ công, phân công xe và tài xế, đội xe, thêm xe, quản lý tài xế.
- Tài xế: chuyến được giao, xác nhận lấy hàng, xác nhận giao hàng, lịch sử sự kiện, chia sẻ vị trí GPS khi trình duyệt cho phép.
- Chat theo đơn và bản đồ Mapbox khi có token và có tọa độ thật.

Chưa xong, hoặc cố ý chưa làm:

- Nghiệm thu hình ảnh FE-05A chưa xong. Một số màn vẫn đang chỉnh.
- FE-05B chưa bắt đầu.
- Đăng ký công khai chưa có. Trang đăng ký không tạo tài khoản.
- Vai trò WAREHOUSE chưa có.
- Huy hiệu xác thực doanh nghiệp chưa có.
- Không tự ghép đơn, không tự điều phối, không tự gán xe.
- Không có ETA, không có vị trí xe bịa.
- Thanh toán, phí nền tảng, VAT chưa có.
- Khu quản trị chỉ là trang báo chưa mở.
- Sàn nhà xe trống khi không có đơn trạng thái đang tìm xe.

## B. Máy cần có

| Công cụ | Yêu cầu |
| --- | --- |
| Git | Để clone |
| Node.js | `>= 20.19`. Vite 8 cần `^20.19.0` hoặc `>= 22.12.0` |
| npm | Đi kèm Node |
| MongoDB | Nghe `127.0.0.1:27017` |
| Docker Desktop | Không bắt buộc. Chỉ dùng nếu chưa cài MongoDB |
| Chrome hoặc Edge | Bản mới |

Không có `package.json` ở thư mục gốc. Đừng chạy `npm install` ở gốc.

## C. Clone và cài

PowerShell:

```powershell
git clone https://github.com/Van125478/Coldi-express.git
cd Coldi-express
git checkout main
git pull
cd server
npm install
cd ..\web
npm install
```

## D. Biến môi trường

Trong `server`:

```powershell
copy .env.example .env
```

Mở `server/.env`. Không commit file này. Không gửi file này vào nhóm.

Điền:

```text
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/coldi
FRONTEND_ORIGIN=http://127.0.0.1:5173
NODE_ENV=development
AUTH_SECRET=<chuỗi tự đặt, ít nhất 32 ký tự>
```

`AUTH_SECRET` mỗi máy một chuỗi. Không dán chuỗi đó vào GitHub.

Bốn tài khoản demo. Email giữ như mẫu. Mật khẩu mỗi người tự đặt, 8 đến 72 ký tự. Không ghi mật khẩu vào Git hay vào issue.

```text
DEMO_SHIPPER_EMAIL=shipper.demo@coldi.local
DEMO_SHIPPER_PASSWORD=<mật khẩu local>
DEMO_CARRIER_EMAIL=carrier.demo@coldi.local
DEMO_CARRIER_PASSWORD=<mật khẩu local>
DEMO_DRIVER_EMAIL=driver.demo@coldi.local
DEMO_DRIVER_PASSWORD=<mật khẩu local>
DEMO_ADMIN_EMAIL=admin.demo@coldi.local
DEMO_ADMIN_PASSWORD=<mật khẩu local>
```

Frontend gọi API tại `http://127.0.0.1:4000` khi không đặt `VITE_API_ORIGIN`.

Mapbox chỉ cần khi muốn vẽ bản đồ. Tạo `web/.env.local`, không commit:

```text
VITE_MAPBOX_PUBLIC_TOKEN=<token công khai bắt đầu bằng pk.>
```

Không dùng token `sk.`. Token hạn chế theo tên miền có thể trả 403 tại `127.0.0.1`. Không có token thì ứng dụng vẫn chạy, nhưng không vẽ bản đồ.

Mở web bằng `http://127.0.0.1:5173`. Đừng dùng `localhost`. Cookie và CORS gắn với `127.0.0.1`. Đăng nhập từ `localhost` bị từ chối.

## E. Chạy ứng dụng

Ba cửa sổ.

1. MongoDB tại `127.0.0.1:27017`.

Nếu dùng Docker, trong thư mục `server`:

```powershell
docker compose up -d
```

File `server/docker-compose.yml` dùng image `mongo:7` và chỉ mở cổng ra `127.0.0.1:27017`.

2. API, trong `server`:

```powershell
npm run dev
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

Khi MongoDB đã nối, kết quả có `status` là `ok`, `service` là `coldi-api`, `database` là `connected`. Nếu MongoDB tắt, API vẫn mở và health trả 503, `database` là `unavailable`.

3. Web, trong `web`:

```powershell
npm run dev
```

Mở `http://127.0.0.1:5173`.

Cổng cố định: API `4000`, web `5173`. Nếu `5173` đang bị chiếm, Vite dừng, không nhảy sang cổng khác.

## F. Tài khoản demo

Chỉ chạy trên cơ sở dữ liệu local dùng để thử. Đừng chạy trên dữ liệu chung hoặc dữ liệu cần giữ.

Trong `server`, sau khi MongoDB và `.env` đã sẵn sàng:

```powershell
npm run seed:demo
npm run seed:fleet
```

`seed:demo` tạo hoặc cập nhật bốn tài khoản theo email trong `.env`. Chạy lại ghi lại mật khẩu đã băm của đúng bốn email đó. Script không xóa đơn. Script từ chối chạy khi `NODE_ENV=production`.

| Email | Vai trò |
| --- | --- |
| `shipper.demo@coldi.local` | SHIPPER, chủ hàng |
| `carrier.demo@coldi.local` | CARRIER, nhà xe |
| `driver.demo@coldi.local` | DRIVER, tài xế |
| `admin.demo@coldi.local` | ADMIN, quản trị |

`seed:fleet` chạy sau `seed:demo`. Script gắn tài xế demo với nhà xe demo và tạo một xe demo nếu xe đó chưa có.

Không có lệnh đặt lại mật khẩu demo trong bản này. Đừng tìm script reset ngoài hướng dẫn.

Muốn đổi vai trò: Đăng xuất, rồi đăng nhập tài khoản kia. Không có nút đổi vai trò trong một phiên.

Tài xế do nhà xe tạo mới có thể bị yêu cầu đổi mật khẩu lần đầu. Đó là hành vi đã có. Tài khoản demo seed thì dùng mật khẩu trong `.env` của máy mình.

Đơn kiểm thử do chính người thử tạo trên máy local. Đừng sửa đơn demo cũ nếu không phải đơn mình vừa tạo để thử.

## G. Việc cần bấm

### Khách

- `/` mở được và phần điện ảnh hiện.
- `/giai-phap/chu-hang`, `/giai-phap/nha-xe`, `/ve-chung-toi` mở được.
- `/dang-nhap` có email, mật khẩu, nút hiện mật khẩu và nút đăng nhập.
- `/shipper`, `/carrier`, `/driver` khi chưa đăng nhập không vào được khu làm việc.

### Chủ hàng

Đăng nhập `shipper.demo@coldi.local`.

- Vào `/shipper`.
- Tạo một đơn mới trên `/shipper/tao-don`.
- Thấy đơn trong danh sách.
- Mở chi tiết, xem trạng thái và timeline.
- Đăng xuất.

### Nhà xe

Đăng nhập `carrier.demo@coldi.local`.

- `/carrier` là trang chủ, có thẻ chuyến đã nhận nếu đã có dữ liệu.
- `/carrier/tim-chuyen` là sàn thật. Tìm và lọc. Nếu sàn trống, đó là vì chưa có đơn đang tìm xe, không phải lỗi mất trang.
- Mở một đơn đang tìm xe do chủ hàng vừa tạo.
- Nhận chuyến bằng tay.
- Vào Chuyến của tôi, phân công xe và tài xế đã có.
- `/carrier/doi-xe` xem đội xe.
- `/carrier/doi-xe/xe/moi` mở form thêm xe. Chỉ lưu nếu cố ý tạo xe thử.
- `/carrier/doi-xe/tai-xe` xem quản lý tài xế. Không tạo tài xế nếu không cần thử luồng đó.

### Tài xế

Đăng nhập `driver.demo@coldi.local`, sau khi nhà xe đã phân công chuyến cho tài xế này.

- `/driver` thấy chuyến được giao.
- Mở chi tiết.
- Xác nhận lấy hàng, rồi xác nhận giao hàng, trên đơn thử.
- Xem lịch sử sự kiện đã ghi.
- Nếu trình duyệt hỏi quyền vị trí, thử chia sẻ. Không có quyền hoặc không có token Mapbox thì ghi lại đúng việc đang thấy, đừng coi là đã có ETA.

### Khác vai trò

- Chủ hàng không vào được khu nhà xe.
- Nhà xe không vào được khu chủ hàng.
- Tài xế không nhận đơn trên sàn.
- Sau đăng nhập, mỗi vai trò về đúng trang của mình.
- Đơn vừa nhận hoặc vừa giao hiện lại cho đúng vai trò có quyền.

## H. Giới hạn đã biết

- Đăng ký công khai chưa làm.
- WAREHOUSE chưa làm.
- Huy hiệu xác thực chưa làm.
- Sàn trống khi không có đơn đang tìm xe.
- Không tự ghép, không tự điều phối.
- Không bịa vị trí xe hay ETA.
- Bản đồ cần token Mapbox và tọa độ thật.
- Thanh toán chưa làm.
- Giao diện vẫn đang chỉnh. Chưa nghiệm thu hình ảnh.
- FE-05B chưa bắt đầu.

Đừng báo các mục trên như thể chúng đã hứa hoạt động rồi bị hỏng, trừ khi màn hình đang nói rằng chúng đã chạy.

## I. Mẫu báo lỗi

Tạo issue trên GitHub. Không dán mật khẩu, `AUTH_SECRET`, token, cookie, hay dữ liệu cá nhân.

```text
Tiêu đề:

SHA đang thử:
Vai trò:
Trang / URL:
Máy: Windows / Node / Chrome hoặc Edge
Các bước:
1.
2.
3.
Kết quả mong đợi:
Kết quả thực tế:
Ảnh hoặc lỗi console:
Mức: Blocker / High / Medium / Low
```

Blocker: không đăng nhập được, không mở được app, hoặc mất dữ liệu đơn vừa tạo.
High: một luồng chính của vai trò gãy.
Medium: sai nhưng còn đường khác để làm tiếp.
Low: chữ, khoảng cách, hoặc lỗi nhỏ không chặn luồng.
