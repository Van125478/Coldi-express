# Cài đặt và chạy COLDI trên Windows

Tài liệu này dành cho người chưa quen Git, terminal, Node.js hay MongoDB. Làm lần lượt. Đừng nhảy bước.

Bản này là **WIP / Team Testing**. Không phải production. Không phải MVP đã hoàn thành.

Cách dùng sau khi đã mở được website: [USER_GUIDE_BEGINNERS.md](USER_GUIDE_BEGINNERS.md). Khi lệnh hoặc trang báo lỗi: [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

Môi trường viết hướng dẫn: Windows 10/11, PowerShell. Lệnh dưới đây là lệnh PowerShell. Đừng đổi sang lệnh Linux nếu máy bạn là Windows.

## Bản đồ tài liệu

Người mới → cài đặt (file này) → chạy ứng dụng (file này) → đăng nhập (file này) → dùng từng vai ([hướng dẫn sử dụng](USER_GUIDE_BEGINNERS.md)) → kịch bản thử ([cùng file đó](USER_GUIDE_BEGINNERS.md)) → xử lý lỗi ([TROUBLESHOOTING.md](TROUBLESHOOTING.md)).

## 1. Phần mềm cần có

### Bắt buộc

| Phần mềm | Việc nó làm | Cách biết đã có |
| --- | --- | --- |
| Git | Tải mã từ GitHub về máy | `git --version` |
| Node.js `>= 20.19.0` | Chạy API và giao diện. Vite 8 cần `^20.19.0` hoặc `>= 22.12.0` | `node --version` |
| npm | Cài thư viện. Đi kèm Node.js | `npm --version` |
| MongoDB nghe `127.0.0.1:27017` | Nơi lưu tài khoản và đơn | Một trong hai cách ở mục 5 |
| Chrome hoặc Edge | Mở website | Mở trình duyệt được |

`server/package.json` khai báo `"node": ">=20.19.0"`. `web/package.json` không khai báo engines. Vite 8.3 đang dùng trong `web` khai báo `"node": "^20.19.0 || >=22.12.0"`. Một bản Node thỏa cả hai, ví dụ 20.19.0 trở lên trong nhánh 20, hoặc 22.12.0 trở lên.

### Không bắt buộc

| Phần mềm | Khi nào cần |
| --- | --- |
| Docker Desktop | Chỉ khi máy chưa có MongoDB và bạn chọn cách B |
| VS Code hoặc Cursor | Để đọc mã. Không cần để chạy website |
| Token Mapbox | Chỉ khi muốn thấy bản đồ. Đăng nhập và đăng đơn không cần token |

**Mục đích của bước kiểm tra:** biết máy thiếu gì trước khi clone.

**Thực hiện ở đâu:** PowerShell, thư mục nào cũng được.

```powershell
git --version
node --version
npm --version
docker --version
```

**Kết quả mong đợi:**

- Git in một dòng bắt đầu bằng `git version`.
- Node in `v20.19.0` hoặc số mới hơn còn đúng dải ở trên. `v18` là chưa đủ.
- npm in một số phiên bản. Không cần một số cố định.
- `docker --version` chỉ chứng minh lệnh Docker có trên máy. Nó không chứng minh Docker Desktop đang chạy. Nếu chưa cài Docker và bạn dùng MongoDB cài sẵn, bỏ qua lỗi “docker không nhận lệnh”.

**Nếu gặp lỗi:** xem [TROUBLESHOOTING.md](TROUBLESHOOTING.md), nhóm Cài đặt.

**Dữ liệu:** bốn lệnh này chỉ đọc phiên bản. Không tạo đơn, không đổi mật khẩu.

## 2. Tải mã về máy

**Mục đích:** có một thư mục chứa đúng mã nhóm đang thử.

**Điều kiện:** Git đã có. Có mạng tới GitHub.

**Thực hiện ở đâu:** PowerShell. Hãy `cd` vào thư mục bạn muốn chứa dự án, ví dụ `C:\Users\TenBan`. Đừng clone vào trong một bản COLDI đang sửa dở.

```powershell
git clone https://github.com/Van125478/Coldi-express.git
cd Coldi-express
git checkout main
git pull --ff-only
git branch --show-current
git status --short
git rev-parse HEAD
```

Mỗi lệnh nghĩa là:

| Lệnh | Nghĩa |
| --- | --- |
| `git clone ...` | Tải kho `Van125478/Coldi-express` thành thư mục `Coldi-express` |
| `cd Coldi-express` | Đi vào thư mục vừa tải. Đây là thư mục gốc của dự án |
| `git checkout main` | Chọn nhánh `main`. `main` là bản nhóm dùng sau khi chủ dự án merge |
| `git pull --ff-only` | Kéo commit mới, chỉ khi lịch sử nối thẳng. Nếu lệnh dừng, đừng tự sửa lịch sử; gửi nguyên văn lỗi |
| `git branch --show-current` | In tên nhánh hiện tại. Phải là `main` |
| `git status --short` | Bản clone sạch thường không in dòng nào |
| `git rev-parse HEAD` | In mã commit, gọi là SHA hoặc HEAD. Ghi vào báo lỗi |

HEAD là “commit mà thư mục này đang đứng”. Nó không phải mật khẩu và không phải địa chỉ website.

Nhánh cũ như `feature/cinematic-scroll` không phải điểm bắt đầu của người mới. Đừng checkout nhánh đó để cài bản thử.

**Kết quả mong đợi:** thư mục có `server`, `web`, `docs`. `git branch --show-current` in `main`.

**Cách kiểm tra:**

```powershell
Test-Path server\package.json
Test-Path web\package.json
Test-Path docs\team-testing\TEAM_TESTING_GUIDE.md
```

Mỗi lệnh in `True`.

**Dữ liệu:** clone không đụng MongoDB.

Nếu pull request của bản tài liệu này chưa được merge, `main` trên GitHub chưa có file hướng dẫn mới. Lúc đó người review dùng đúng nhánh của pull request, không bảo người mới checkout nhánh tích hợp như việc thường ngày. Sau khi merge, người mới chỉ dùng `main`.

## 3. Thư mục trong kho

| Thư mục | Việc của nó |
| --- | --- |
| `server\` | API: đăng nhập, đơn, nhận chuyến, đội xe, GPS, chat, nối MongoDB. Test nằm ở `server\tests\` |
| `web\` | Giao diện React mà trình duyệt mở |
| `docs\` | Hướng dẫn, quyết định, báo cáo |

Thư mục gốc **không** có `package.json`. `npm ci` ở thư mục gốc sẽ thất bại vì npm không thấy dự án. Phải vào `server` hoặc `web`.

`server\package-lock.json` và `web\package-lock.json` đều có. Vì vậy bản clone sạch dùng `npm ci`, không dùng `npm install` để tự nâng thư viện.

## 4. Cài thư viện

**Mục đích:** tải đúng phiên bản thư viện đã khóa trong lockfile.

**Điều kiện:** đã `cd` vào `Coldi-express`. Node và npm đã đúng phiên bản. Có mạng.

**Thực hiện ở đâu:** PowerShell, lần lượt hai thư mục.

```powershell
cd server
npm ci
cd ..\web
npm ci
```

**`npm ci` làm gì:** xóa `node_modules` nếu có, rồi cài đúng lockfile. Không sửa `package.json`. Phù hợp máy clone sạch.

**Kết quả mong đợi:** mỗi lệnh chạy một lúc rồi trở lại dấu nhắc, không có dòng `npm ERR!`.

**Cách kiểm tra:**

```powershell
Test-Path ..\server\node_modules
Test-Path node_modules
```

Lệnh thứ hai chạy khi bạn còn đứng trong `web`. Cả hai in `True`.

**Nếu gặp lỗi:** đừng chạy `npm audit fix` và đừng tự nâng gói. Gửi nguyên văn `npm ERR!`. Xem [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Dữ liệu:** chỉ tạo thư mục `node_modules`. Không ghi MongoDB.

## 5. MongoDB — chọn một cách

COLDI cần một MongoDB nghe `127.0.0.1`, cổng `27017`. Địa chỉ mặc định trong `server\.env.example` là `mongodb://127.0.0.1:27017/coldi`.

Chỉ chạy **một** MongoDB trên cổng đó. Đừng bật cả MongoDB cài sẵn lẫn container Docker cùng cổng.

### Cách A — MongoDB đã cài trên Windows

**Mục đích:** dùng chương trình MongoDB có sẵn.

**Điều kiện:** MongoDB Community hoặc bản tương đương đã cài. Tên dịch vụ Windows không cố định. Đừng đoán tên. Mở `services.msc`, tìm dịch vụ có chữ MongoDB, trạng thái phải là Running. Nếu không thấy, dùng cách B hoặc cài MongoDB theo trang mongodb.com. Hướng dẫn này không gắn một tên dịch vụ.

**Cách kiểm tra cổng**, PowerShell:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

`TcpTestSucceeded : True` nghĩa là có chương trình đang nghe cổng. Nó không chứng minh chương trình đó là MongoDB cho đến khi API health báo `database: connected`.

**Dữ liệu:** `Test-NetConnection` không ghi đơn.

Đừng xóa thư mục data của MongoDB để “sửa cổng”.

### Cách B — Docker Desktop, chỉ khi chưa có MongoDB

**Mục đích:** tạo một MongoDB riêng trong container.

**Điều kiện:** Docker Desktop đã mở và engine đang chạy. `docker --version` không đủ. Chạy:

```powershell
docker info
```

Nếu báo daemon không chạy, mở Docker Desktop và đợi đến khi ứng dụng nói engine đã sẵn sàng, rồi chạy lại `docker info`.

**Trước khi bật container**, kiểm tra cổng 27017 như cách A. Nếu `TcpTestSucceeded` là `True`, đã có MongoDB. Dừng. Đừng chạy `docker compose up`.

**Thực hiện ở đâu:** PowerShell, thư mục `server` của bản clone. File thật là `server\docker-compose.yml`. Image là `mongo:7`. Cổng xuất ra chỉ `127.0.0.1:27017`. Dữ liệu nằm trong volume tên `coldi-mongo`.

```powershell
cd server
docker compose up -d
docker compose ps
```

**Kết quả mong đợi:** `docker compose ps` cho thấy service `mongodb` đang chạy.

**Dừng container mà giữ dữ liệu:**

```powershell
cd server
docker compose stop
```

`stop` tắt container. Volume `coldi-mongo` còn. Đừng chạy `docker compose down -v` và đừng xóa volume chỉ để xử lý trùng cổng. Hướng dẫn này không yêu cầu lệnh xóa dữ liệu.

**Nếu cổng bị chiếm:** Docker sẽ báo không bind được `27017`. Tắt lệnh. Dùng MongoDB đang nghe cổng đó. Đừng đổi cổng trong tài liệu và đừng xóa container của người khác.

## 6. File cấu hình backend

**Mục đích:** API biết cổng, database, trang web được phép gọi, và chuỗi ký phiên đăng nhập.

File `.env` nằm trên máy bạn. Git không nhận file này. Đừng gửi file này cho người khác và đừng dán vào issue.

**Điều kiện:** đã đứng được trong thư mục `server`. File `server\.env.example` có trong kho.

```powershell
cd server
Copy-Item .env.example .env
notepad .env
```

`Copy-Item` tạo `server\.env` từ file mẫu. `notepad .env` mở file để sửa. Có thể dùng VS Code hoặc Cursor thay cho notepad.

Điền đúng các dòng sau. Giữ nguyên tên biến, bên trái dấu `=`.

```text
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/coldi
FRONTEND_ORIGIN=http://127.0.0.1:5173
NODE_ENV=development
AUTH_SECRET=
```

| Biến | Nghĩa | Giá trị local |
| --- | --- | --- |
| `PORT` | Cổng API | `4000`. Phải là số nguyên từ 1 đến 65535. Mã từ chối giá trị khác |
| `MONGODB_URI` | Địa chỉ database | `mongodb://127.0.0.1:27017/coldi` nếu dùng MongoDB trên máy. Phải bắt đầu bằng `mongodb://` hoặc `mongodb+srv://` |
| `FRONTEND_ORIGIN` | Địa chỉ trang web được phép gọi API và nhận cookie | Đúng `http://127.0.0.1:5173`. Dấu `*` bị từ chối. `http://localhost:5173` là một nguồn khác |
| `NODE_ENV` | Chế độ chạy | `development` khi tự chạy máy. Giá trị hợp lệ chỉ có `development`, `test`, `production` |
| `AUTH_SECRET` | Chuỗi ký cookie phiên | Bạn tự đặt, **ít nhất 32 ký tự**. Ô trống trong file mẫu không chạy được. API báo `AUTH_SECRET must be at least 32 characters.` |

Ví dụ độ dài, không phải chuỗi để chép vào máy thật: một câu tiếng Việt không dấu dài hơn 32 ký tự. Mỗi máy một chuỗi. Đừng dùng chuỗi mẫu nếu bạn vừa đọc nó trên một kênh chung. Đừng commit chuỗi đó.

`PORT` và địa chỉ web phải khớp nhau: trình duyệt mở `http://127.0.0.1:5173`, API nghe `http://127.0.0.1:4000`, và `FRONTEND_ORIGIN` là địa chỉ trình duyệt. Cookie đăng nhập gắn với đúng cặp đó.

Bốn tài khoản demo đọc thêm các biến trong cùng file. Email để như mẫu. Mật khẩu mỗi người tự đặt, từ 8 đến 72 ký tự. Để trống cho đến khi bạn cố ý tạo tài khoản demo ở mục 9.

```text
DEMO_SHIPPER_EMAIL=shipper.demo@coldi.local
DEMO_SHIPPER_PASSWORD=
DEMO_CARRIER_EMAIL=carrier.demo@coldi.local
DEMO_CARRIER_PASSWORD=
DEMO_DRIVER_EMAIL=driver.demo@coldi.local
DEMO_DRIVER_PASSWORD=
DEMO_ADMIN_EMAIL=admin.demo@coldi.local
DEMO_ADMIN_PASSWORD=
```

**Cách kiểm tra file tồn tại**, không in nội dung ra màn hình nhóm:

```powershell
Test-Path .env
```

In `True`. Đừng chạy `Get-Content .env` trên một cuộc họp có người khác nhìn màn hình.

**Dữ liệu:** tạo file chữ trên đĩa. Chưa ghi MongoDB.

## 7. Mapbox — không bắt buộc để đăng nhập

Mapbox vẽ bản đồ nền và marker khi đã có tọa độ GPS. Trang chủ và đăng nhập không cần token.

Khi muốn thử bản đồ, tạo `web\.env.local`. File này cũng không được commit. Mở PowerShell ở thư mục `web`:

```powershell
cd web
notepad .env.local
```

Một dòng:

```text
VITE_MAPBOX_PUBLIC_TOKEN=
```

Điền token công khai bắt đầu bằng `pk.`. Không điền token `sk.`. Token `sk.` là khóa bí mật, không được đưa vào giao diện.

Không có dòng này, hoặc để trống: ứng dụng vẫn chạy. Khối vị trí vẫn hiện tọa độ nếu API đã có điểm. Câu trên màn hình là `Bản đồ chưa được cấu hình. Tọa độ vẫn hiện ở trên.`

Token Mapbox bị giới hạn theo tên miền có thể trả 403 tại `http://127.0.0.1:5173`, vì Mapbox không nhận địa chỉ IP trong phần hạn chế URL. Máy local cần một token `pk.` không hạn chế URL. Đó là ghi chú trong `web\.env.example`.

Sau khi sửa `.env.local`, tắt Vite bằng `Ctrl+C` trong cửa sổ đang chạy `npm run dev`, rồi chạy lại `npm run dev` trong `web`. Vite chỉ đọc biến lúc khởi động.

**Dữ liệu:** file token không ghi đơn hàng.

## 8. Ba địa chỉ, đừng trộn

| Địa chỉ | Việc |
| --- | --- |
| `http://127.0.0.1:5173` | Trang web. Cổng 5173 bị khóa trong `web\vite.config.ts`. Nếu cổng bận, Vite dừng, không đổi sang 5174 |
| `http://127.0.0.1:4000` | API |
| `127.0.0.1:27017` | MongoDB. Trình duyệt không mở cổng này |

`localhost` và `127.0.0.1` là hai nguồn khác nhau với cookie và kiểm tra origin. Trên Windows, `localhost` có thể đi IPv6 trước. Mở web bằng `http://127.0.0.1:5173`. Đăng nhập từ `http://localhost:5173` bị từ chối, mã `invalid_origin`.

## 9. Bật và tắt

Cần ba thứ cùng chạy: MongoDB, API, trang web. Mỗi cái một cửa sổ PowerShell. Đừng tắt cửa sổ API rồi vẫn mong trang web gọi được dữ liệu.

### Cửa sổ 1 — MongoDB

Cách A: dịch vụ Windows đang Running. Không có lệnh thêm.

Cách B: đã `docker compose up -d` trong `server`.

### Cửa sổ 2 — API

**Thực hiện ở đâu:** PowerShell, thư mục `server`.

```powershell
cd server
npm run dev
```

**Kết quả mong đợi khi MongoDB nối được:** log có `MongoDB connected.` và `COLDI API listening on port 4000.`

**Cách kiểm tra**, mở cửa sổ PowerShell thứ tư, không tắt cửa sổ API:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

Khi database nối được, HTTP 200 và nội dung:

```text
status   : ok
service  : coldi-api
database : connected
```

Khi API đang chạy nhưng MongoDB chưa nối, HTTP 503. PowerShell báo lỗi vì mã 503. Nội dung JSON trong mã là `status: degraded`, `service: coldi-api`, `database: unavailable`. `degraded` không có nghĩa API đã tắt.

Khi cửa sổ API chưa chạy hoặc cổng 4000 không mở, `Invoke-RestMethod` báo không kết nối được. Đó không phải 401 hay 403.

### Cửa sổ 3 — trang web

**Thực hiện ở đâu:** PowerShell khác, thư mục `web`.

```powershell
cd web
npm run dev
```

**Kết quả mong đợi:** dòng `Local: http://127.0.0.1:5173/`.

Mở Chrome hoặc Edge tại đúng địa chỉ đó.

**Tắt an toàn:** bấm vào cửa sổ đang chạy `npm run dev`, nhấn `Ctrl+C`, xác nhận nếu PowerShell hỏi. Làm riêng cho API và cho web. `Ctrl+C` dừng tiến trình trong cửa sổ đó. Đừng tắt mọi `node.exe` trên máy, vì máy có thể đang chạy việc khác.

`docker compose stop` chỉ dùng nếu bạn đã bật MongoDB bằng Docker và muốn tắt container. Không dùng lệnh đó với cách A.

### Sau khi tắt máy và mở lại, tôi cần chạy gì?

1. Bật MongoDB: dịch vụ Windows, hoặc mở Docker Desktop rồi trong `server` chạy `docker compose up -d` nếu lần trước bạn dùng Docker.
2. Cửa sổ PowerShell, `cd` vào `Coldi-express\server`, `npm run dev`.
3. Cửa sổ khác, `cd` vào `Coldi-express\web`, `npm run dev`.
4. Mở `http://127.0.0.1:5173`.
5. Đăng nhập lại nếu cookie hết hoặc đã mất. Cookie `coldi_session` sống 12 giờ, `HttpOnly`, `SameSite=Lax`.

Không cần `npm ci` lại nếu không xóa `node_modules` và không đổi lockfile.

## 10. Tài khoản demo

Chỉ làm mục này trên database mới hoặc database bạn chấp nhận ghi đè. `npm run seed:demo` tạo hoặc cập nhật bốn email demo và **ghi lại mật khẩu đã băm** của đúng bốn email đó. Nó không xóa đơn. Nó từ chối chạy khi `NODE_ENV=production`.

Đừng chạy seed trên database dùng chung, database đang giữ tài khoản người khác, hoặc database phát triển của máy đang có đơn cần giữ.

**Điều kiện:** MongoDB đang chạy. `server\.env` đã có bốn email và bốn mật khẩu 8–72 ký tự. API không cần đang chạy. `NODE_ENV` không phải `production`.

**Thực hiện ở đâu:** PowerShell, thư mục `server`.

```powershell
cd server
npm run seed:demo
npm run seed:fleet
```

| Lệnh | Việc | Dữ liệu |
| --- | --- | --- |
| `npm run seed:demo` | Tạo hoặc cập nhật bốn tài khoản theo email trong `.env` | Ghi đè `passwordHash` và `role` của bốn email đó. Không xóa đơn |
| `npm run seed:fleet` | Gắn tài xế demo vào nhà xe demo và tạo một xe demo nếu xe đó chưa có | Phải chạy sau `seed:demo`. Nếu tài xế đã gắn nhà xe khác, script dừng và không đổi mối gắn |

| Email | Vai |
| --- | --- |
| `shipper.demo@coldi.local` | SHIPPER, Chủ hàng |
| `carrier.demo@coldi.local` | CARRIER, Nhà xe |
| `driver.demo@coldi.local` | DRIVER, Tài xế |
| `admin.demo@coldi.local` | ADMIN, Quản trị |

Mật khẩu là giá trị bạn đã ghi trong `.env` của máy mình. Tài liệu này không chứa mật khẩu.

Tài xế demo sau `seed:fleet` thuộc nhà xe demo nên nhà xe đó phân công được. Tài xế do nhà xe tạo mới trên màn hình có thể bị yêu cầu đổi mật khẩu lần đầu tại `/driver/doi-mat-khau` trước khi vào chuyến. Tài khoản seed dùng mật khẩu trong `.env` và không đi đường mật khẩu tạm, trừ khi bạn tự tạo tài xế mới trên giao diện.

Bản `package.json` đã commit không có lệnh đặt lại mật khẩu demo. Đừng chạy script reset nào ngoài hai lệnh seed ở trên.

**Đổi vai:** bấm `Đăng xuất` trên khu làm việc, rồi đăng nhập email kia. Không có nút đổi vai trong cùng một phiên.

## 11. Đăng nhập để biết máy chạy

**Mục đích:** xác nhận trình duyệt nói chuyện được với API.

**Điều kiện:** cả ba cửa sổ ở mục 9 đang chạy, và bạn đã seed trên database dùng để thử.

1. Mở `http://127.0.0.1:5173/dang-nhap`.
2. Ô `Email`: `shipper.demo@coldi.local`.
3. Ô mật khẩu: mật khẩu trong `.env` của máy bạn, không chép từ chat.
4. Nút `Đăng nhập`.

**Kết quả mong đợi:** trình duyệt tới `/shipper`. Menu trái có `Trang chủ`, `Tạo đơn`, `Quản lý đơn`.

Sai email hoặc sai mật khẩu cùng câu `Email hoặc mật khẩu không đúng.`

**Dữ liệu:** đăng nhập tạo cookie. Không tạo đơn.

Việc bấm từng luồng nghiệp vụ nằm ở [USER_GUIDE_BEGINNERS.md](USER_GUIDE_BEGINNERS.md). Đừng đánh dấu PASS cho bước bạn chưa bấm.

## 12. Mức “có mã” và mức “đã nghiệm thu”

| Mức | Nghĩa |
| --- | --- |
| Code complete | Màn hoặc API có trong mã |
| Automated tested | Test API trên database tên `*_test`. Không đụng database `coldi` |
| Browser inspected | Đã mở trình duyệt. Thường không ghi nghiệp vụ |
| E2E pending | Chưa có biên bản bấm đủ đăng → nhận → phân công → lấy → GPS → giao |
| Mapbox real rendering pending | Chưa chứng minh tile và marker |
| User visual accepted | VISUAL LAYOUT ACCEPTED: Carrier Home (thẻ chuyến, ảnh phía trên), phân công xe và tài xế, Driver Home task-first, cấu trúc khung chat Shipper/Carrier. Không phải FUNCTIONAL UAT. E2E, chat lưu thật và Mapbox tile/marker chưa xác minh đầy đủ |

Chi tiết và phương án B: [MVP_STATUS_2026-10-18.md](../mvp-review/MVP_STATUS_2026-10-18.md).
