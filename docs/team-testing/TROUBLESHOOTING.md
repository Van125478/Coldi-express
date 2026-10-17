# Xử lý sự cố COLDI trên Windows

Mỗi dòng là một triệu chứng đã gặp hoặc đã được mã trả về. Cách sửa chỉ đọc cấu hình hoặc tắt đúng cửa sổ. Không xóa database, không seed lại database dùng chung, không `git reset`, không tắt kiểm tra đăng nhập, không đưa mật khẩu vào tài liệu, không cấp GPS cho quản trị.

Cài đặt nằm ở [TEAM_TESTING_GUIDE.md](TEAM_TESTING_GUIDE.md). Cách bấm nghiệp vụ nằm ở [USER_GUIDE_BEGINNERS.md](USER_GUIDE_BEGINNERS.md).

Mã HTTP phụ thuộc từng API. 401, 403, 404, 409 không có một nghĩa cho mọi địa chỉ.

| Triệu chứng | Nguyên nhân hay gặp | Cách kiểm tra | Cách xử lý an toàn |
| --- | --- | --- | --- |
| PowerShell báo `git` is not recognized | Git chưa cài hoặc cửa sổ mở trước khi cài | `git --version` | Cài Git cho Windows, đóng PowerShell, mở lại |
| `node` is not recognized | Node chưa cài hoặc chưa có trên PATH | `node --version` | Cài Node.js bản thỏa `>= 20.19.0` và dải Vite `^20.19.0` hoặc `>= 22.12.0`, mở lại PowerShell |
| `npm` is not recognized | npm đi cùng Node nhưng cửa sổ cũ chưa thấy | `npm --version` | Mở PowerShell mới sau khi cài Node. Đừng tải npm riêng nếu Node đã có |
| `node --version` là v18 hoặc thấp hơn 20.19 | Sai bản Node | Đọc số sau chữ `v` | Cài bản Node đúng dải ở trên. Đừng sửa `engines` trong kho để khỏi cảnh báo |
| `npm ci` báo `npm ERR!` | Sai thư mục, mạng, hoặc lockfile lệch với `package.json` trên bản bạn đang đứng | `pwd` hoặc `Get-Location`. Phải là `...\server` hoặc `...\web`, và thư mục đó có `package-lock.json` | Chạy lại đúng thư mục. Đừng `npm audit fix`. Nếu ERR nói lockfile lệch, ghi nguyên văn và dừng, đừng tự sửa phiên bản gói |
| `npm ci` ở thư mục gốc | Gốc không có `package.json` | `Test-Path package.json` in `False` | `cd server` hoặc `cd web` |
| `Test-NetConnection` cổng 27017, `TcpTestSucceeded` là `False` | Không có chương trình nào nghe MongoDB | Chạy lại lệnh đó | Cách A: mở `services.msc`, bật dịch vụ có chữ MongoDB nếu bạn đã cài. Tên dịch vụ không cố định. Cách B: Docker, chỉ khi cổng đang trống |
| API log không có `MongoDB connected.` | API không nối được URI trong `.env` | `Invoke-RestMethod http://127.0.0.1:4000/api/health` | Sửa `MONGODB_URI` cho đúng máy. Giữ database tên bạn định dùng. Đừng đổi sang database người khác |
| Health HTTP 503, JSON `status` `degraded`, `database` `unavailable` | API sống, MongoDB chưa nối | Cổng 4000 vẫn trả lời | Bật MongoDB. Đừng tắt API chỉ vì 503 nếu bạn đang dùng mã này để chẩn đoán |
| `Invoke-RestMethod` không kết nối được `127.0.0.1:4000` | Cửa sổ `npm run dev` trong `server` chưa chạy, hoặc cổng khác | Nhìn cửa sổ API còn log không | Chạy `npm run dev` trong `server`. Nếu log báo cổng 4000 đang dùng, tìm cửa sổ API cũ và dùng cửa sổ đó. Đừng kill mọi Node |
| `docker info` lỗi daemon | Docker Desktop chưa chạy | `docker --version` vẫn có thể thành công | Mở Docker Desktop, đợi engine, chạy lại `docker info` |
| `docker compose up` báo cổng 27017 đã chiếm | Đã có MongoDB local hoặc container khác | `Test-NetConnection -ComputerName 127.0.0.1 -Port 27017` | Dùng MongoDB đang nghe. Đừng `docker compose down -v`, đừng xóa volume |
| Vite báo cổng 5173 đã được sử dụng rồi thoát | `strictPort` trong `web\vite.config.ts` | Một cửa sổ `npm run dev` của `web` đang mở | Dùng `http://127.0.0.1:5173` của cửa sổ đó. Tắt bằng `Ctrl+C` trong đúng cửa sổ nếu bạn cần bật lại |
| Trang mở nhưng mọi thao tác lưu đều lỗi mạng | API tắt hoặc trang gọi nhầm máy | Health ở cổng 4000 | Bật API. Giữ `FRONTEND_ORIGIN=http://127.0.0.1:5173` |
| Đăng nhập ra `Email hoặc mật khẩu không đúng.` | Sai mật khẩu trong `.env`, hoặc chưa seed trên database này | Bạn có chạy `npm run seed:demo` trên đúng `MONGODB_URI` không | Chỉ seed lại nếu database này là database dùng một lần và bạn chấp nhận ghi đè mật khẩu bốn email demo |
| Đăng nhập từ `localhost` bị từ chối, `invalid_origin` | Cookie và CORS gắn `127.0.0.1` | Thanh địa chỉ | Đổi sang `http://127.0.0.1:5173`. Sửa `FRONTEND_ORIGIN` nếu bạn đã ghi `localhost` |
| API 401 | Chưa đăng nhập, cookie không gửi, hoặc phiên hết | Bạn có đang mở đúng `127.0.0.1` không | Đăng nhập lại. 401 trên một API không có nghĩa mọi API đều cùng lý do |
| API 403 | Đúng là đã đăng nhập nhưng sai vai, hoặc tài xế chưa đổi mật khẩu, hoặc tài khoản khóa | Đọc `code` trong JSON nếu trình duyệt hiện | Đăng xuất và vào đúng vai. Tài xế mới: `/driver/doi-mat-khau`. Tài khoản khóa: nhà xe `Mở khóa` khi không còn chuyến chặn. Đừng sửa mã cho quản trị xem mọi đơn |
| API 404 trên đơn hoặc GPS nhà xe | Sai id, hoặc nhà xe không phải người đã nhận | So `Mã đơn` | Mở đúng id. 404 GPS nhà xe cố ý không nói đơn có tồn tại hay không |
| API 409 khi nhận chuyến | Nhà xe khác đã nhận | Xem trạng thái đơn | Chọn đơn khác đang `Đang tìm xe`. Đừng nhận lại đơn đã có chủ |
| API 409 khi phân công lần hai | Đơn đã có xe và tài xế | Trang chuyến của tôi | Không gán đè. Tài xế xác nhận lấy trên cặp đã gán |
| Sàn 0 đơn | Chưa có đơn `Đang tìm xe`, hoặc bộ lọc | Tắt bộ lọc. Chủ hàng vừa đăng trên cùng database chưa | Đăng một đơn trên database thử. Đừng bịa đơn trên giao diện |
| Không thấy nút phân công được bấm | Chưa chọn cả xe và tài xế, hoặc đội trống | Câu `Nhà xe chưa có xe hoặc tài xế để phân công.` | Thêm xe và tài xế trên database thử, hoặc dùng xe demo sau `seed:fleet` |
| Tài xế không thấy chuyến | Chưa được gán, sai tài khoản, hoặc chưa đổi mật khẩu tạm | Nhà xe đã phân công đúng email tài xế này chưa | Phân công đúng tài xế. Tài xế mở `/driver` sau khi đổi mật khẩu nếu bị yêu cầu |
| Không bấm được xác nhận lấy | Chuyến không ở trạng thái chờ lấy của tài xế này | Chữ trên trang | Chỉ tài xế được gán, sau phân công, trước khi đã lấy |
| Không bấm được xác nhận giao | Chưa xác nhận lấy | Trạng thái còn chờ lấy | Xác nhận lấy trước |
| Vẫn `MATCHED` sau phân công | Đúng thiết kế | Chữ `Chờ lấy hàng` | Đợi tài xế xác nhận lấy. Phân công không tự sang đang vận chuyển |
| `Không mở được cuộc trao đổi.` | Mất đăng nhập, sai đơn, hoặc API tắt | Health và vai nhà xe | Sửa kết nối. Bấm lại `Mở trao đổi` chỉ trên đơn thử |
| `Không gửi được tin nhắn. Nội dung vẫn còn trong ô soạn.` | API từ chối hoặc mạng đứt | Ô soạn còn chữ | Giữ bản nháp, kiểm tra API, gửi lại. Đừng tải lại trang nếu chưa chép bản nháp |
| Tin người kia chưa hiện | Trang hỏi tin mỗi 5 giây, không phải WebSocket | Đợi vài giây trên đúng đơn | Ở lại trang. Không có biên nhận đã đọc |
| `Cuộc trao đổi này không còn nhận tin nhắn mới.` | Thread không còn cho viết, thường sau khi nhà xe khác đã nhận | Trạng thái đơn | Nhà xe đã nhận đơn là bên còn viết với chủ hàng |
| Chủ hàng thấy nhiều tab | Nhiều nhà xe đã mở trao đổi | Nhãn tab | Chọn đúng nhà xe trước khi trả lời |
| Tài xế không thấy nút chia sẻ vị trí | Chưa xác nhận lấy | Câu `Chia sẻ vị trí mở sau khi xác nhận lấy hàng.` | Xác nhận lấy trên đơn thử. GPS không thay nút xác nhận |
| `Trình duyệt đã từ chối quyền vị trí.` | Bạn bấm Chặn | Biểu tượng khóa của Chrome hoặc Edge trên thanh địa chỉ | Cho phép vị trí cho `http://127.0.0.1:5173`, bấm `Bắt đầu chia sẻ vị trí` lại. Vẫn xác nhận giao được nếu không có GPS |
| `Chưa có vị trí xe được cập nhật.` | Chưa lấy hàng, hoặc đã lấy mà chưa gửi điểm | Trạng thái và nút chia sẻ của tài xế | Đúng đơn, đúng giai đoạn. Không tự thêm tọa độ |
| Chủ hàng không thấy GPS của đơn người khác | Đúng quyền | Mã đơn có phải đơn mình tạo không | Chỉ xem đơn của tài khoản đang đăng nhập |
| Nhà xe không thấy GPS | Chưa nhận đơn, hoặc đang mở đơn khác | `Mã đơn` | Mở chuyến mình đã nhận, cùng id với chủ hàng |
| `Bản đồ chưa được cấu hình.` | Chưa có `VITE_MAPBOX_PUBLIC_TOKEN` dạng `pk.` trong `web\.env.local` | Tọa độ chữ vẫn có thể hiện | Điền token rồi tắt và bật lại Vite. Không bắt buộc để đăng nhập |
| Bản đồ không ra nền dù đã có token | Token `sk.`, token hạn chế URL, hoặc WebGL | Câu `Bản đồ chưa mở được trên trình duyệt này.` hoặc lỗi 403 trong công cụ mạng của trình duyệt | Dùng `pk.` không hạn chế URL cho máy `127.0.0.1`. Tile thật chưa có biên bản pass. Đừng đánh dấu đã xem bản đồ nếu chỉ thấy tọa độ |
| `Vị trí cập nhật đã lâu.` | Điểm cuối quá 20 phút | Giờ `Cập nhật lúc` | Tài xế còn trang chia sẻ thì điểm mới sẽ thay. Điểm cũ không phải xe đang chạy |
| Đã giao mà vẫn thấy tọa độ | Điểm cuối giữ làm lịch sử | Câu `Theo dõi trực tiếp đã kết thúc.` | Đọc là lịch sử. Đừng gọi là đang vận chuyển |
| `Chưa có bản đồ tuyến giữa điểm lấy và điểm giao.` | Địa chỉ là chữ, chưa có tuyến | Khối `Bản đồ lộ trình` tách khỏi `Theo dõi vị trí xe` | Không có nút để bật tuyến. Đây không phải lỗi GPS |

Đăng nhập tài xế báo khóa: nhà xe mở khóa trên hồ sơ tài xế khi việc đó không bị chuyến đang chạy chặn. Đừng tạo mật khẩu mới bằng một script nằm ngoài `package.json` đã commit.
