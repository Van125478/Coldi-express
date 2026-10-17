# MVP-04 — Bản đồ GPS Mapbox

Ngày ghi: 2026-10-17. Nhánh `integration/coldi-v2.3-mvp`.

LIVE MAP MANUAL VERIFICATION PENDING. Đợt này không có token Mapbox hợp lệ, không mở tile, và không đặt marker bằng vị trí thiết bị thật. Kết quả tự động bên dưới không chứng minh bản đồ đã hiện trên trình duyệt.

## Vì sao chọn Mapbox

Master Const v2.3 mô tả Live Map cho chủ hàng và nêu Goong hoặc Mapbox, với điều kiện xác nhận provider trước production. Chủ sản phẩm đã chọn Mapbox GL JS v3 cho MVP này.

Goong không bị xóa khỏi tương lai. Nó vẫn là ứng viên cho geocoding địa chỉ Việt Nam sau này. Nó không vẽ bản đồ của đợt này.

API GPS Core 09 giữ nguyên: một `latestLocation` trên đơn, tài xế được gán gửi khi `IN_TRANSIT`, chủ đơn đọc `GET /api/shipments/:id/location`. Không thêm collection vị trí, WebSocket, Redis, Kafka, hay geocode trên server.

## Phiên bản

`mapbox-gl` 3.33.0, khóa trong `web/package-lock.json`. Import theo hướng dẫn npm của Mapbox: `mapbox-gl/esm` và CSS `mapbox-gl/dist/mapbox-gl.css`. Token truyền vào option `accessToken` của `Map`, không gán `mapboxgl.accessToken`.

Style đang dùng là `mapbox://styles/mapbox/streets-v12`. Không dùng style Standard 3D mặc định của v3.

## Token

Biến Vite:

```bash
VITE_MAPBOX_PUBLIC_TOKEN=
```

Mã đọc `import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN`. Chỉ nhận chuỗi bắt đầu bằng `pk.`, dài ít nhất 10 ký tự, không có khoảng trắng. Chuỗi `sk.` bị từ chối. Mẫu trống nằm ở `web/.env.example`. Token thật để ở `web/.env.local`. Cả `.env.local` và `*.local` đều bị Git bỏ qua. Không commit token.

Biến môi trường này không che token. Token công khai nằm trong bundle trình duyệt. Đó là cách Mapbox GL JS hoạt động. Token bí mật `sk.` không được đưa vào frontend.

Phạm vi đủ để vẽ bản đồ, theo trang token của Mapbox: `styles:read` và `fonts:read`. Không thêm scope bí mật.

### Hạn chế URL và `127.0.0.1`

Trang token của Mapbox nói hạn chế URL không hỗ trợ địa chỉ IP. `127.0.0.1` không đưa vào danh sách cho phép được. Request từ URL không được phép trả `403`.

`localhost` cũng bị chặn trừ khi được ghi rõ trong danh sách. COLDI local phải ở `http://127.0.0.1:5173` vì cookie phiên gắn host đó. Đổi Vite sang `localhost` sẽ làm đăng nhập lệch site. Vì vậy token local cần không có hạn chế URL. Token mặc định của tài khoản không gắn được hạn chế URL; nó dùng được cho máy local nếu còn hạn mức.

Nếu không ghi cổng, Mapbox chỉ cho cổng 80 và 443. Site thật chạy cổng khác phải ghi cả cổng. `Referrer-Policy` `no-referrer` hoặc `same-origin` làm request mất referer và token bị hạn chế URL trả 403.

Production nên dùng một token `pk.` khác, chỉ `styles:read` và `fonts:read`, hạn chế đúng domain và cổng của site. Không dùng chung token local không hạn chế cho site công khai.

Tài khoản trial của Mapbox có thể chỉ có một token mặc định cho đến khi thêm phương thức thanh toán. Đợt này không tạo tài khoản, không mở billing, và không bịa token để test.

## Cài cho đồng đội

1. Cài dependency trong `web/` bằng lockfile. Không cần gói React wrapper.
2. Tạo `web/.env.local` với một dòng `VITE_MAPBOX_PUBLIC_TOKEN=pk...` từ token công khai của chính mình.
3. Giữ web tại `http://127.0.0.1:5173` và API tại `http://127.0.0.1:4000`.
4. Khởi động lại `npm run dev` sau khi sửa file môi trường.
5. Đăng nhập chủ hàng, mở đơn đang `IN_TRANSIT` đã có vị trí, bấm “Mở bản đồ”.
6. Nếu tile 403, kiểm tra token có hạn chế URL hoặc có phải `sk.`. Với máy local, dùng token `pk.` không hạn chế URL.

Không có token thì `npm run dev` và `npm run build` vẫn chạy. API GPS vẫn chạy. Panel hiện trạng thái, tọa độ và hai mốc thời gian, kèm câu chưa có khóa bản đồ.

## Cách map được tạo và hủy

`ShipmentLocation` poll vị trí. Nó không import Mapbox cho đến khi chủ hàng bấm “Mở bản đồ” hoặc “Xem vị trí cuối trên bản đồ”. `ShipmentLiveMap` được `lazy()`. Bên trong, `import("mapbox-gl/esm")` chạy sau khi component đã mount.

Một `Map` và một `Marker` được tạo cho lần mở đó. Poll sau gọi `marker.setLngLat`. Không gọi `new Map` lại. Nút “Về vị trí xe” gọi `easeTo` về điểm hiện tại. Kéo bản đồ không bị kéo tâm lại mỗi lần poll.

Cleanup gọi `map.remove()`, gỡ marker và `ResizeObserver`. Effect đánh dấu hủy trước khi promise import xong, để React StrictMode không giữ hai map. Lỗi tile thường không hủy map. HTTP 401 hoặc 403 thì gỡ map và hiện câu không tải được.

Mapbox tính phí theo lần tạo map, không theo mỗi lần đổi marker. Trang chi tiết đơn không tạo map cho đến khi chủ hàng bấm.

`mapboxgl.supported()` sai thì hiện câu trình duyệt không chạy được WebGL. Phần còn lại của đơn vẫn dùng được. Mapbox GL JS v3 cần WebGL 2.

## Poll và các trạng thái

Poll khoảng 90 giây khi phase là `waiting_for_fix`, `current`, hoặc `stale`. Ẩn tab thì dừng hẹn giờ. Tab hiện lại thì tải một lần nếu vẫn còn theo dõi. `ended` không poll.

| Tình huống | Việc hiện |
| --- | --- |
| Chưa `IN_TRANSIT` | Không vẽ xe đang chạy |
| `IN_TRANSIT`, chưa có điểm | “Chưa nhận được vị trí GPS.” |
| Điểm mới | Bản đồ khi đã mở, marker, thời điểm máy chủ nhận và thời điểm thiết bị quan sát |
| Điểm cũ | Điểm cuối kèm “Vị trí này đã cũ. Không phải vị trí đang trực tiếp.” |
| Đã giao, còn điểm | “Đây là vị trí cuối đã ghi. Chuyến đã ngừng theo dõi trực tiếp.” Nút xem vị trí cuối, không nói đang theo dõi |
| Đã giao, không có điểm | Không có marker |
| API lỗi | “Không thể tải vị trí.” và “Thử lại”. Không giữ điểm cũ như điểm hiện tại |
| Không token | Tọa độ và thời điểm, không tạo map |
| WebGL hoặc Mapbox lỗi | Câu lỗi, tọa độ phía trên vẫn còn nếu API đã trả |

Tọa độ đưa vào Mapbox là `[kinh độ, vĩ độ]`. Vĩ độ ngoài -90..90 hoặc kinh độ ngoài -180..180 không được đặt marker.

## Quyền và riêng tư

Server vẫn quyết định ai đọc GPS. Chủ đơn đọc được. Chủ hàng khác nhận 403. Tài xế được gán chỉ gửi khi `IN_TRANSIT`. Tài xế khác không gửi được. Nhà xe và admin không tự được xem GPS. DTO sàn không có tọa độ.

Frontend không có route công khai cho map. Không ghi tọa độ ra console. Không đưa mã đơn, tên tài xế, nội dung chat hay liên hệ vào URL hoặc metadata gửi Mapbox.

Mapbox vẫn nhận request tile và viewport để vẽ. Lần đầu map lấy tâm là đúng điểm GPS, nên request đó cho Mapbox biết vùng đang xem. Token công khai không làm dữ liệu GPS thành dữ liệu riêng. Quyền của `GET /api/shipments/:id/location` vẫn bắt buộc.

## Giới hạn thiết bị

Tài xế vẫn dùng geolocation của trình duyệt trong `DriverLocationShare`. Không có `GeolocateControl` của Mapbox. Không theo dõi ngầm, không lấy vị trí ở trang khác, không hứa GPS nền. Giao hàng không cần GPS. GPS không đổi status và không thêm event timeline.

Chia sẻ dừng khi rời trang hoặc ẩn tab, đúng policy cũ. Không có hàng đợi offline.

## Chứng cứ tự động

`server/tests/mapboxMap.test.ts` không nối MongoDB và không import `mapbox-gl`. Nó kiểm tra:

1. `toMapboxPosition(10.7769, 106.7009)` thành `[106.7009, 10.7769]`.
2. Thiếu hoặc hỏng tọa độ trả `null`, và phase `current` với vĩ độ 91 thành trạng thái chờ, không bịa điểm.
3. Poll ba điểm chỉ tạo một map và đổi marker.
4. `destroy` gỡ một lần.
5. Phase `stale` giữ tone cũ. Phase `ended` là lịch sử. Hết điểm sau khi giao thì không còn marker.
6. Token trống hoặc `sk.` không mở map. WebGL tắt và lỗi tải có fallback riêng.
7. Lỗi API không hiện tọa độ đang có như điểm hiện tại.

Quyền GPS, GPS không đổi status, sàn không rò tọa độ, và timeline không có event GPS vẫn nằm ở `gps.test.ts`, `security.test.ts`, và `timeline.test.ts`. Lượt `npm test` sau khi thêm file này: 55 pass, 0 fail. Số 51 trước đó là baseline trước bốn test bản đồ.

Web `npm run lint`, `npx tsc -b`, và `npm run build` pass. Chunk `mapbox-gl` tách khỏi bundle đầu. Build không chứng minh tile.

## Nghiệm thu tay — chưa chạy

Dùng đơn mới. Không sửa `6ad25c2fcf4c13c7d5b735dc` và `6ad2fc6b0f1e6b36c1404649`. Không đưa tọa độ nhà vào ảnh chia sẻ.

1. Ghi token `pk.` hợp lệ vào `web/.env.local`, rồi khởi động lại web.
2. Chủ hàng mở chi tiết một đơn mới.
3. Nhà xe Claim và gán xe, tài xế.
4. Tài xế xác nhận đã lấy hàng.
5. Tài xế bật chia sẻ vị trí và cấp quyền trình duyệt.
6. Một điểm GPS thật được ghi.
7. Chủ hàng mở Live Map trên đơn đó.
8. Mapbox hiện tile thật.
9. Marker nằm đúng tọa độ API đã nhận.
10. Điểm mới làm marker dịch, không tạo lại cả map.
11. Điểm cũ có câu cảnh báo, không bị gọi là đang trực tiếp.
12. Tài xế xác nhận giao hàng.
13. Theo dõi trực tiếp dừng.
14. Timeline vẫn năm mốc nghiệp vụ: đăng, nhận, phân công, lấy, giao.

## Chưa làm

Dynamic ETA, routing, geocoding, ping gần kho, lộ trình đã đi, khoảng cách tới điểm giao, và suy ra giao hàng từ GPS. Không có nghiệm thu tile hay marker trên trình duyệt.
