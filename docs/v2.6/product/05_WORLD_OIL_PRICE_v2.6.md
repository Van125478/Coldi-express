# COLDI v2.6 — Cập nhật giá dầu thế giới (World Oil Price, MVP)

**APPROVED scope clarification từ Product Owner:** CHỈ CẦN CẬP NHẬT GIÁ DẦU THẾ GIỚI. **Không** theo dõi đổ dầu, lít dầu, định mức, tiêu hao L/100 km, chi phí nhiên liệu theo xe/tài xế/chuyến. Các phiên bản tài liệu trước mô tả 'Fuel Statistics' theo hướng nhập dữ liệu nhiên liệu là **đã bị thay thế** bởi quyết định này.

## 1. Mục tiêu và giao diện tối thiểu

Một vùng thông tin trên website COLDI hiển thị **giá dầu thô tham chiếu quốc tế gần nhất đã được nguồn dữ liệu công bố**, tối thiểu 1 benchmark; đề xuất **Brent và WTI** để dễ hiểu hơn cụm mơ hồ 'giá dầu thế giới'.

Đối với từng giá, hiển thị:

- Tên benchmark: `Brent` / `WTI`.
- Giá trị số hợp lệ (không hardcode ví dụ), đơn vị **USD/thùng (USD/barrel)**.
- **Ngày quan sát/thời điểm của dữ liệu gốc** từ provider, khác **thời điểm COLDI lấy về**.
- Nguồn có link tham khảo, ví dụ U.S. Energy Information Administration (EIA).
- Nhãn `Giá tham khảo, không phải giá bán lẻ diesel tại Việt Nam, không phải giá cước vận chuyển`.

**Không hứa real-time từng giây:** dữ liệu daily spot có thể không có ngày cuối tuần/nghỉ lễ và nhà cung cấp phát hành trễ. Không bịa giá thay cho record thiếu. Không có mặc định đề xuất nhập giá bằng tay vào dashboard.

## 2. Nguồn đề xuất và kỹ thuật tích hợp (DRAFT)

- **Ưu tiên** EIA Open Data API v2 / dataset dầu thô spot Brent/WTI, chọn đúng `series` và `frequency=daily` được provider xác nhận khi implementation; không hardcode mã series chưa kiểm chứng.
- Tài liệu nguồn: https://www.eia.gov/opendata/documentation.php và https://www.eia.gov/dnav/pet/PET_PRI_SPT_S1_W.htm.
- Unit ghi nhận là **USD per barrel**, không tự đổi VND/lít; nếu sau này có quy đổi phải có nguồn FX, định nghĩa một barrel, thời điểm và cách làm tròn riêng.
- Kiểm tra license/điều khoản hiển thị, API key/quota, timestamp/timezone và retries thực tế trước khi triển khai.
- Backend server-to-provider: không đặt API key private vào Vite/browser; frontend chỉ gọi COLDI read-only endpoint. Public key nếu nhà cung cấp cho phép vẫn nên cấu hình qua env backend.

## 3. OIL-01 — Tải giá dầu gần nhất

1. Người dùng mở trang công khai hoặc trang workspace có khối 'Giá dầu thế giới' (quyết định vị trí UI còn mở).
2. FE GET endpoint read-only do COLDI cung cấp; không buộc đăng nhập nếu quyết định cho public.
3. Backend trả data từ cache hợp lệ của nguồn chính thức; định kỳ đồng bộ nguồn bên ngoài, kiểm tra schema/numeric/unit/date.
4. FE hiển thị benchmark, latest observed period, source; có badge *'Bản cập nhật mới nhất đã công bố'* thay vì 'trực tiếp' nếu feed không real-time.
5. Nếu không có dữ liệu: báo `Chưa tải được giá dầu thế giới`, có retry; KHÔNG hiển thị 0 USD hoặc số sample.

## 4. OIL-02 — Đồng bộ/fallback khi nguồn lỗi

**Tần suất đề xuất:** chạy fetch tối đa một vài lần/ngày hoặc phù hợp lịch công bố của dataset; không cần poll liên tục mỗi vài giây. Nếu provider API lỗi/timeout/429:

- Khi có cache gần nhất → hiển thị giá cache kèm thời điểm nguồn và nhãn **'Dữ liệu có thể đã cũ'**; không đổi ngày quan sát thành thời gian COLDI vừa request.
- Khi không có cache → trạng thái unavailable; không đoán giá.
- Không để lỗi feed dầu làm fail đăng nhập, đăng đơn, Claim hoặc pickup/delivery.
- Không ghi value trùng cho cùng benchmark/ngày/source khi retry.
- Ngày nghỉ/không có observation mới: đó không tự động là lỗi kỹ thuật; UI thể hiện ngày gần nhất và label phù hợp.
- Giá `<=0`, `NaN`, sai currency/unit, ngày tương lai bất thường, response cấu trúc không đúng → reject và giữ cache hợp lệ, log lý do.

**Đề xuất stale rule:** không dùng cutoff 20 phút của GPS. Chọn ngưỡng theo lịch provider, ví dụ khi quá 3 ngày lịch mà không có observation mới thì cảnh báo; **ngưỡng phải phê duyệt** vì dịp nghỉ dài.

## 5. OIL-03 — Quyền, bảo mật, vận hành

- Đây là dữ liệu hàng hóa thị trường công khai, đề xuất Guest/SHIPPER/CARRIER/DRIVER xem được; không nên khóa chỉ vì user chưa mua gói. Có thể ẩn khỏi driver UI nếu cần tối giản.
- Chỉ backend worker/admin cấu hình provider được refresh cache; không cho người dùng sửa giá nhận từ EIA.
- Rate limit, timeout, retry với backoff, caching và status monitoring; không cho request browser mỗi user gọi upstream trực tiếp.
- Lưu `provider`, `benchmark`, `period`, `value`, `unit`, `fetchedAt`, `validationStatus` tùy lựa chọn cache; không lưu dữ liệu người dùng/GPS trong bản ghi giá dầu.
- Không liên kết giá dầu với tự động cập nhật `listedPriceVnd`, carrier net, hoa hồng, hay giá gói. Muốn pricing động phải có quyết định riêng.

## 6. API DRAFT, chưa triển khai

`GET /api/market/oil-prices` → danh sách `{ benchmark, price, currency: 'USD', unit: 'barrel', observedDate, fetchedAt, source, stale }` khi đã có dữ liệu. Status/errors theo convention hiện có. Endpoint là **đề xuất**, không tồn tại trong source baseline.

## 7. Acceptance test tối thiểu

1. Dữ liệu thật từ provider → đúng tên benchmark, ngày quan sát, đơn vị, nguồn.
2. Request fail → fallback cache gắn stale; không cache → empty/error dễ hiểu.
3. Provider trả invalid date/price → không hiển thị bậy, không phá nghiệp vụ vận tải.
4. Đồng bộ hai lần cùng series+date không sinh 2 record.
5. Không có API key trong bundle frontend hoặc Git.
6. Không cần tài xế nhập lần đổ dầu; không có form `FuelRecord`/`liters`/`odometer`.

## 8. Quyết định còn mở

- Chỉ Brent hay Brent + WTI; nguồn chính EIA hay provider được phê duyệt khác.
- Vị trí hiển thị (trang khách, Carrier dashboard hay cả hai), daily hay weekly, ngưỡng stale, tỷ giá có cần không, phải có biểu đồ lịch sử hay chỉ số mới nhất (user nói đơn giản → **đề xuất chỉ latest**).
- Xử lý khi nhà cung cấp đổi schema, giá trị bất thường và lịch cập nhật cụ thể.
