# Hướng dẫn kiểm thử COLDI cho nhóm

Bản này là **WIP / Team Testing**. Không phải bản production và không phải MVP đã hoàn thành.

Nhánh kiểm thử: `main`.

Sau khi clone hoặc `git pull`, chạy:

```powershell
git rev-parse HEAD
```

Ghi đúng SHA đó vào mỗi báo lỗi. Đừng chép SHA từ một báo cáo cũ.

## A. Bản đang thử

Logistics đã có mã. Test API đã chạy trên database tách biệt trong lượt chuẩn bị bản này. Kết quả ghi ở [MVP_STATUS_2026-10-18.md](../mvp-review/MVP_STATUS_2026-10-18.md). Web không có bộ test giao diện tự động.

| Mức | Nghĩa trong bản này |
| --- | --- |
| Code complete | Màn hoặc API có trong mã `main` |
| Automated tested | Có test API trên database `*_test`, không đụng database phát triển |
| Browser inspected | Đã mở trên trình duyệt, thường không ghi nghiệp vụ |
| E2E pending | Chưa bấm đủ chuỗi đăng → nhận → phân công → lấy → GPS → giao |
| Mapbox real rendering pending | Chưa chứng minh tile và marker Mapbox |
| User visual accepted | Chỉ bố cục trang chủ tài xế đã được chủ dự án chấp nhận. Các màn FE-05A khác chưa được chấp nhận hình ảnh |

Chưa xong, hoặc cố ý chưa làm:

- E2E logistics chưa được nghiệm thu.
- Tile và marker Mapbox chưa được chứng minh.
- FE-05B chưa bắt đầu.
- Package Management chưa triển khai. Phương án B yêu cầu phần này cho MVP cuối, nhưng bản team testing này chưa có gói, hạn mức hay thanh toán.
- Đăng ký công khai chưa có. Trang `/dang-ky` không tạo tài khoản.
- Vai trò WAREHOUSE chưa có.
- Huy hiệu xác thực doanh nghiệp chưa có.
- Không tự ghép đơn, không tự điều phối, không tự gán xe.
- Không có ETA, không có vị trí xe bịa, không có tuyến vẽ.
- Thanh toán online chưa có và nằm sau MVP.
- Khu quản trị chỉ là trang báo chưa mở.
- Sàn nhà xe trống khi không có đơn đang tìm xe.

Đừng đánh dấu PASS cho mục chưa chạy.

## B. Máy cần có

| Công cụ | Yêu cầu |
| --- | --- |
| Git | Để clone |
| Node.js | `>= 20.19.0`, cùng mức `server/package.json`. Vite 8 cần `^20.19.0` hoặc `>= 22.12.0` |
| npm | Đi kèm Node. Bản clone sạch dùng `npm ci` |
| MongoDB | Nghe `127.0.0.1:27017` |
| Docker Desktop | Không bắt buộc. Chỉ dùng nếu chưa có MongoDB |
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
npm ci
cd ..\web
npm ci
```

`npm ci` cài đúng lockfile. Dùng `npm install` chỉ khi cố ý cập nhật phụ thuộc.

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

Mapbox chỉ cần khi muốn thử vẽ bản đồ. Tạo `web/.env.local`, không commit:

```text
VITE_MAPBOX_PUBLIC_TOKEN=<token công khai bắt đầu bằng pk.>
```

Không dùng token `sk.`. Token hạn chế theo tên miền có thể trả 403 tại `127.0.0.1`. Không có token thì ứng dụng vẫn chạy và vẫn hiện tọa độ, nhưng không vẽ bản đồ. Việc hiện tọa độ không có nghĩa tile đã pass.

Mở web bằng `http://127.0.0.1:5173`. Đừng dùng `localhost`. Cookie và CORS gắn với `127.0.0.1`. Đăng nhập từ `localhost` bị từ chối.

## E. Chạy ứng dụng

Ba cửa sổ.

1. MongoDB tại `127.0.0.1:27017`.

Nếu cổng 27017 đã có MongoDB local, dùng bản đó. Đừng dựng thêm một container cùng cổng.

Nếu máy chưa có MongoDB, trong thư mục `server`:

```powershell
docker compose up -d
```

File `server/docker-compose.yml` dùng image `mongo:7` và chỉ mở cổng ra `127.0.0.1:27017`. Nếu Docker báo cổng đã bị chiếm, dừng lệnh và dùng MongoDB đang nghe cổng đó.

2. API, trong `server`:

```powershell
npm run dev
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

Khi MongoDB đã nối, kết quả có `status` là `ok`, `service` là `coldi-api`, `database` là `connected`. Nếu MongoDB tắt, API vẫn mở, HTTP 503, `status` là `degraded`, `database` là `unavailable`.

3. Web, trong `web`:

```powershell
npm run dev
```

Mở `http://127.0.0.1:5173`.

Cổng cố định: API `4000`, web `5173`. Nếu `5173` đang bị chiếm, Vite dừng, không nhảy sang cổng khác.

## F. Tài khoản demo

Chỉ chạy seed trên database mới hoặc database dùng một lần để thử. Seed ghi đè mật khẩu đã băm của đúng bốn email demo. Đừng chạy trên database đang giữ tài khoản hoặc đơn cần giữ.

Trong `server`, sau khi MongoDB và `.env` đã sẵn sàng:

```powershell
npm run seed:demo
npm run seed:fleet
```

`seed:demo` tạo hoặc cập nhật bốn tài khoản theo email trong `.env`. Script không xóa đơn. Script từ chối chạy khi `NODE_ENV=production`.

| Email | Vai trò |
| --- | --- |
| `shipper.demo@coldi.local` | SHIPPER, chủ hàng |
| `carrier.demo@coldi.local` | CARRIER, nhà xe |
| `driver.demo@coldi.local` | DRIVER, tài xế |
| `admin.demo@coldi.local` | ADMIN, quản trị |

`seed:fleet` chạy sau `seed:demo`. Script gắn tài xế demo với nhà xe demo và tạo một xe demo nếu xe đó chưa có.

Bản đã publish không có lệnh đặt lại mật khẩu demo. Đừng chạy script reset ngoài hướng dẫn này.

Muốn đổi vai trò: Đăng xuất, rồi đăng nhập tài khoản kia. Không có nút đổi vai trò trong một phiên.

Tài xế do nhà xe tạo mới có thể bị yêu cầu đổi mật khẩu lần đầu trước khi vào chuyến. Tài khoản demo seed dùng mật khẩu trong `.env` của máy mình.

Đơn kiểm thử do chính người thử tạo trên máy local. Đừng sửa đơn demo cũ nếu không phải đơn mình vừa tạo để thử.

## G. Việc cần bấm

Đánh dấu từng mục là đã chạy hoặc chưa chạy. Đừng ghi PASS cho mục bỏ qua.

### Khách

- `/` mở được và phần điện ảnh hiện.
- `/giai-phap/chu-hang`, `/giai-phap/nha-xe`, `/ve-chung-toi` mở được.
- `/dang-nhap` có email, mật khẩu, nút hiện mật khẩu và nút đăng nhập.
- `/dang-ky` không tạo tài khoản.
- `/shipper`, `/carrier`, `/driver`, `/admin` khi chưa đăng nhập không vào được khu làm việc.

### SHIPPER

Đăng nhập `shipper.demo@coldi.local`.

- Vào `/shipper`.
- Đăng một đơn mới trên `/shipper/tao-don`.
- Thấy đơn trong quản lý đơn.
- Mở chi tiết, xem trạng thái và timeline.
- Mở chatbox nếu đã có nhà xe nhắn. Enter gửi, Shift+Enter xuống dòng. Chat không nhận chuyến và không đổi giá.
- Xem GPS của đơn thuộc mình. Không có điểm thì câu là chưa có vị trí, không phải một vị trí bịa.
- Đăng xuất.

### CARRIER

Đăng nhập `carrier.demo@coldi.local`.

- `/carrier` là trang chủ.
- `/carrier/tim-chuyen` là sàn thật. Tìm, lọc, sắp xếp. Sàn trống nghĩa là chưa có đơn đang tìm xe.
- Mở một đơn đang tìm xe do chủ hàng vừa tạo.
- Mở chatbox. Chat không nhận chuyến.
- Nhận chuyến bằng tay, có xác nhận.
- Vào Chuyến của tôi, phân công xe và tài xế thuộc nhà xe này.
- `/carrier/doi-xe` xem và, nếu cố ý, tạo hoặc sửa xe thử.
- `/carrier/doi-xe/tai-xe` xem quản lý tài khoản tài xế. Tạo, khóa, mở khóa hoặc đặt lại mật khẩu chỉ khi đang thử luồng đó trên dữ liệu thử.
- Trên chuyến nhà xe đã nhận, xem GPS. Đơn chưa nhận không được hiện vị trí của nhà xe khác.

### DRIVER

Đăng nhập `driver.demo@coldi.local` sau khi nhà xe đã phân công chuyến cho tài xế này.

- `/driver` là dashboard mới: số đếm và chuyến cần làm.
- `/driver/chuyen` là danh sách chuyến.
- Mở chi tiết. Xác nhận lấy hàng, rồi xác nhận giao hàng, trên đơn thử.
- Khi chuyến đang vận chuyển, thử chia sẻ GPS nếu trình duyệt cho phép.
- Xem timeline. GPS không tự xác nhận lấy hoặc giao. Giao không phải thanh toán.
- Nếu tài khoản bị yêu cầu đổi mật khẩu, hoàn tất `/driver/doi-mat-khau` trước khi vào chuyến. Tài khoản demo seed thường không rơi vào bước này.

### ADMIN

Đăng nhập `admin.demo@coldi.local`.

- Vào được `/admin`.
- Trang nói khu vận hành chưa mở.
- Không dùng tài khoản này để xem đơn chủ hàng, nhận chuyến hay phân công.

### Cách ly vai trò

- Chủ hàng không vào được khu nhà xe.
- Nhà xe không vào được khu chủ hàng.
- Tài xế không nhận đơn trên sàn.
- Sau đăng nhập, mỗi vai trò về đúng trang của mình.

## H. Giới hạn đã biết

- E2E logistics chưa nghiệm thu trên bản này.
- Mapbox tile và marker chưa được chứng minh.
- Package Management chưa có.
- Đăng ký công khai chưa làm.
- WAREHOUSE chưa làm.
- Huy hiệu xác thực chưa làm.
- Sàn trống khi không có đơn đang tìm xe.
- Không tự ghép, không tự điều phối.
- Không bịa vị trí xe, tuyến hay ETA.
- Thanh toán online chưa làm.
- FE-05A chưa được chấp nhận hình ảnh toàn bộ. Bố cục trang chủ tài xế đã được xem và chấp nhận.
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
