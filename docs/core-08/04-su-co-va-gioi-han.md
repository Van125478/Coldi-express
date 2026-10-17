# Sự cố, kiểm thử tự động và giới hạn

## A. Mỗi người một máy

Cách đang hỗ trợ: mỗi máy clone code, chạy MongoDB, API và Vite của chính máy đó.

`127.0.0.1` là máy đang ngồi, không phải máy của đồng đội. Đơn tạo trên máy A không xuất hiện trên sàn của máy B. Tài khoản seed trên máy A cũng không có trên máy B cho đến khi máy B tự chạy `npm run seed:demo` và `npm run seed:fleet`.

Muốn buổi demo ba vai trò, một người có thể đăng xuất rồi đăng nhập vai trò tiếp theo trên cùng một máy. Không cần ba máy.

## B. Dùng chung một môi trường

Chưa có. Không đánh dấu là dùng được.

Muốn có sau này, cần một MongoDB và một API mà cả nhóm nối tới, địa chỉ không phải `127.0.0.1` của từng laptop, `FRONTEND_ORIGIN` đúng địa chỉ web mà nhóm mở, cookie và HTTPS được thiết kế cho tên miền đó, và cơ sở dữ liệu không mở ra internet công cộng.

Đừng nới CORS thành mọi nguồn, đừng tắt kiểm tra Origin, và đừng bỏ `HttpOnly` để demo cho nhanh. Các chốt đó đang bảo vệ đăng nhập local.

## C. Xử lý sự cố trên Windows

Các lệnh PowerShell dưới đây chỉ quan sát hoặc tắt một tiến trình đã xác định. Không xóa cơ sở dữ liệu `coldi` để “chữa” lỗi thường ngày.

### MongoDB chưa chạy

```powershell
Get-Service *mongo*
docker ps
```

`Get-Service *mongo*` chỉ hữu ích khi máy có cài MongoDB dạng dịch vụ. Nếu không thấy dịch vụ, dùng Docker tại thư mục `server`:

```powershell
docker compose up -d
```

Sau đó `Invoke-RestMethod http://127.0.0.1:4000/api/health` phải có `database: connected`. Nếu vẫn `unavailable`, xem cửa sổ API có dòng `MongoDB is unavailable`.

### Cổng 4000 bị chiếm

```powershell
Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, OwningProcess
```

Nếu tiến trình đó là cửa sổ API cũ, sang đúng cửa sổ và nhấn `Ctrl+C`. Chỉ khi cửa sổ đã mất mà cổng vẫn bị giữ, xem tiến trình của đúng PID trước khi dừng:

```powershell
Get-Process -Id <PID> | Select-Object Id, ProcessName, Path
Stop-Process -Id <PID>
```

`Path` hoặc tên tiến trình phải đúng việc bạn vừa mở, ví dụ tiến trình Node của cửa sổ API. Nếu không nhận ra tiến trình, không chạy `Stop-Process`. Không chạy lệnh dừng mọi `node.exe`.

### Cổng 5173 bị chiếm

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, OwningProcess
```

Vite đặt `strictPort: true`, nên không tự sang 5174. Trước khi tắt PID đang nghe 5173, chạy `Get-Process -Id <PID>` và chỉ `Stop-Process` khi đó đúng là Vite cũ. Rồi trong `web` chạy lại `npm run dev`. Địa chỉ mở tiếp tục là `http://127.0.0.1:5173`.

### localhost và 127.0.0.1

Mở `http://127.0.0.1:5173/dang-nhap`. Nếu thanh địa chỉ là `localhost`, đăng nhập có thể trả 403 `invalid_origin` với câu `Trình duyệt gửi yêu cầu từ một nguồn không được phép.` Sửa bằng cách gõ lại địa chỉ `127.0.0.1`. Không đổi `FRONTEND_ORIGIN` sang localhost để né lỗi này.

### Đăng nhập thất bại

`Email hoặc mật khẩu không đúng.` có thể là email chưa được tạo, gõ sai email, hoặc mật khẩu trong `.env` không còn khớp bản đã băm. Đó là các khả năng đã thấy trong luồng đăng nhập, không phải danh sách đầy đủ mọi lỗi mạng.

`npm run seed:demo` ghi đè `passwordHash` và `role` của đúng bốn email demo. Chỉ dùng trên cơ sở dữ liệu local mới, hoặc khi cố ý đặt lại bốn tài khoản đó. Không chạy seed để sửa một đơn hàng. Lệnh không in mật khẩu và không xóa đơn. `npm run seed:fleet` chạy sau đó nếu cần xe và liên kết tài xế.

Đừng chạy `reset:demo-passwords` theo tài liệu này. Lệnh đó chưa có trên nhánh đã đẩy.

### Sai vai trò

Chủ hàng mở `/driver` hoặc `/carrier` thấy `Không có quyền`. Đó là đúng. Bấm `Về khu làm việc` hoặc đăng xuất rồi dùng tài khoản đúng vai trò. Ứng dụng không tự đổi vai trò theo địa chỉ gõ.

### Thiếu tài khoản, thiếu xe, tài xế không gắn nhà xe

Trong `server`:

```powershell
npm run seed:demo
npm run seed:fleet
```

`seed:fleet` cần nhà xe và tài xế đã tồn tại. Nếu tài xế đã gắn nhà xe khác, script dừng và không sửa liên kết. Khi đó phân công sẽ không hiện tài xế demo. Không có màn hình để tự thêm xe hoặc tài xế. Đây là khoảng trống vận hành: fleet sau seed chỉ sửa được bằng dữ liệu đã có, không có CRUD đội xe.

Xe demo có nhãn đúng `Xe đông lạnh demo Core 05`.

### Sàn nhà xe trống

`/carrier/tim-chuyen` chỉ liệt kê đơn `PUBLISHED`. Đơn đã nhận nằm ở `/carrier/chuyen-cua-toi`. Nếu chưa có đơn mới, chủ hàng phải đăng một đơn mới. Đừng nhận lại đơn cũ để làm sàn có dữ liệu.

### Timeline của đơn cũ

Đơn tạo trước Core 07 không có danh sách sự kiện đầy đủ. Trang phải nói rõ chỉ hiện mốc đã lưu thời điểm, và không suy ra giờ nhận chuyến hay giờ phân công. Đó là kết quả đúng, không phải lỗi mất dữ liệu. Không chạy script sửa các đơn cũ cho đủ năm sự kiện.

Nếu một đơn mới, tạo sau khi timeline đã có trong code, mà vẫn chỉ hiện lịch sử một phần, một khả năng là cửa sổ API chưa được khởi động lại sau khi có file timeline. Cũng có thể đang mở nhầm đơn tạo trước Core 07. Đối chiếu mô tả hàng trước khi kết luận chỉ một nguyên nhân.

### Cảnh báo bundle lớn

`npm run build` trong `web` có thể cảnh báo một chunk JavaScript lớn hơn 500 kB sau khi minify. Bản build gần nhất của thư mục này tạo một file `dist/assets/index-*.js` khoảng 1.448,34 kB minify, gzip khoảng 398,73 kB. Đơn vị là kilobyte, không phải megabyte: 1.448,34 kB xấp xỉ 1,4 MB. Cảnh báo không làm build thất bại và không cần xử lý trong Core 08.

## D. Kiểm thử tự động

Chạy trong thư mục tương ứng. Không cần trình duyệt.

`server`:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

`web`:

```powershell
npm run lint
npx tsc -b
npm run build
```

`web/package.json` không có script `typecheck` riêng. `npx tsc -b` là lệnh kiểm tra kiểu đang dùng. `npm run build` của web cũng chạy `tsc -b` trước Vite.

### Cơ sở dữ liệu của test

`npm test` không dùng cơ sở `coldi` để xóa dữ liệu demo.

Các file test tự đổi tên cơ sở trên cùng máy MongoDB local, và chỉ xóa cơ sở khi tên kết nối đúng tên test:

| File | Cơ sở |
| --- | --- |
| `tests/health.test.ts` | không kết nối để xóa dữ liệu |
| `tests/auth.test.ts` | `coldi_auth_test` |
| `tests/shipment.test.ts` | `coldi_shipment_test` |
| `tests/claim.test.ts` | `coldi_claim_test` |
| `tests/assignment.test.ts` | `coldi_assignment_test` |
| `tests/driver.test.ts` | `coldi_driver_test` |
| `tests/timeline.test.ts` | `coldi_timeline_test` |

Nếu tên cơ sở không khớp, test dừng với câu từ chối dùng cơ sở đó.

### 24 test hay 29 test

Commit đã đẩy khai báo `npm test` với sáu file: health, auth, shipment, claim, assignment, driver. Bản đó không gồm timeline.

Commit `cd5045300ac4c788deba3c08053ed1a439481d95` thêm `tests/timeline.test.ts` vào `npm test`. Lần chạy đó báo 29 pass, 0 fail. Buổi bấm tay ngày 17/10/2026 xác nhận luồng chính và lịch sử một phần. Buổi đó không tự bấm lại mọi ca từ chối quyền, thử lại và tranh chấp đồng thời. Các ca đó nằm ở test API.

Đừng xem 29 test là kết quả của một máy clone `main`. `main` chưa có commit timeline.

## E. Quyết định còn thiếu trước khi cả nhóm dùng

1. Commit timeline `cd5045300ac4c788deba3c08053ed1a439481d95` đã có `tests/timeline.test.ts` và không kèm lệnh reset mật khẩu. `main` chưa có commit này. Người mới chỉ clone `main` sau khi merge được duyệt.
2. Giữ `npm run reset:demo-passwords` ngoài Git cho đến khi có quyết định riêng. Hướng dẫn clone chỉ dùng `seed:demo` và `seed:fleet`.
3. Bộ demo chỉ có một nhà xe và một tài xế. Muốn bài kiểm tra tay cho nhà xe thứ hai hoặc tài xế thứ hai thì cần quyết định cách tạo tài khoản thêm. Đừng dùng form đăng ký, form đó không lưu.
4. Chưa có môi trường dùng chung. Đừng mở MongoDB local ra internet để các máy khác trỏ vào.
