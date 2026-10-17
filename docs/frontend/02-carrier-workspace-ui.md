# FE-02 — Giao diện khu Nhà xe

Ngày ghi: 17/10/2026. Nhánh `integration/coldi-v2.3-mvp`. Đây là bản dựng giao diện trên luồng đã có. Người dùng chưa nghiệm thu hình ảnh.

## Ảnh đã xem

- `Asset/coldi/homepagecarthinh.png`: sàn nguồn hàng, thanh tìm, nhóm lọc, thẻ chuyến với tuyến, hàng, giờ bốc và giá.
- `Asset/coldi/chuyến hàng.png`: tiêu đề lấy → giao, cụm hàng hóa và cột giá.
- Các ảnh đội xe, phân công, nhận chuyến và tài xế trong `Asset/coldi/` được dùng làm ngôn ngữ thẻ và hộp thoại. Không có file HTML nguồn trong repo.

Các mục trong ảnh prototype bị bỏ vì trái quy tắc nghiệp vụ đã chốt: ảnh hàng giả, huy hiệu đã xác minh, khoảng cách, điểm đánh giá, VAT, giảm giá, giá dầu, tiệm sửa xe, tài chính, số “1.248 nguồn hàng” không có trong API.

## Ánh xạ

| Màn | Route | Việc đã làm |
| --- | --- | --- |
| Sàn nhà xe | `/carrier` | Tìm kiếm nổi, nhóm nhiệt, lối tắt, thẻ đơn thật, chuyến đang theo dõi khi có dữ liệu |
| Tìm chuyến | `/carrier/tim-chuyen` | Lọc Core 13, bộ lọc gọn trên điện thoại, chip lọc đang dùng, so sánh tối đa hai đơn |
| Chi tiết | `/carrier/chuyen/:id` | Tuyến, bốn ô hàng hóa, cột giá, nhận chuyến, chat |
| Chuyến của tôi | `/carrier/chuyen-cua-toi` | Nhóm chờ phân công, chờ lấy, đang chạy, đã giao; hộp thoại xác nhận trước khi phân công |
| Đội xe | `/carrier/doi-xe` | Thẻ xe, form thêm/sửa gom nhận diện và khả năng chở |
| Tài xế | `/carrier/doi-xe/tai-xe` | Danh sách, huy hiệu, hộp thoại khóa/mở/đặt lại mật khẩu |

## Điều hướng logo

Khách và header công khai vẫn về `/`. Trong khu làm việc, logo về trang chủ của vai trò đang đăng nhập: chủ hàng `/shipper`, nhà xe `/carrier`, tài xế `/driver`, quản trị `/admin`. Không có Role Switcher. Sidebar tối chỉ áp cho nhà xe. Chủ hàng và tài xế giữ layout sáng cũ.

## Thành phần

Dùng lại `WorkspaceLayout`, `CarrierDashboard`, `CarrierLoadBoard`, `ClaimConfirm`, `ClaimedShipments`, `CarrierTripDetail`, `CarrierChat`, `ChatThread`, đội xe và tài khoản tài xế.

Thêm `MarketShipmentCard`, `logoDestination`, `nextComparison`, `appliedFilterLabels`.

## Cố ý không làm

Không có ảnh hàng giả, huy hiệu đã xác minh, khoảng cách, điểm đánh giá, VAT, giảm giá, giá dầu, tiệm sửa xe, phân trang mới, hay trạng thái nghiệp vụ mới. Claim vẫn chỉ gửi API khi bấm xác nhận. Phân công chỉ gửi API khi bấm xác nhận trong hộp thoại. Mật khẩu tạm không lưu storage. Không đổi workspace tài xế.

## Kiểm thử tự động

`server/tests/carrierNavigation.test.ts`: đích logo theo vai trò, và so sánh giữ tối đa hai chuyến. Web không có trình chạy test giao diện.

Đã chạy sau các sửa giao diện:

- Server: `npm test` 62 pass, 0 fail; `npm run typecheck`; `npm run lint`; `npm run build`.
- Web: `npm run lint`; `npx tsc -b`; `npm run build`.

## Trình duyệt đã xem

Đăng nhập tài khoản nhà xe demo, chỉ đọc. Không nhận chuyến, không xác nhận phân công, không tạo hoặc khóa tài xế, không gửi chat.

- Logo khu nhà xe trỏ `/carrier`. Bấm logo từ chi tiết chuyến về `/carrier`.
- Logo trang công khai `/` vẫn trỏ `/`.
- Nhà xe mở `/shipper` thấy trang không có quyền, nút về `/carrier`.
- Sàn 1440, 768 và 390: không tràn ngang cả trang. Nav điện thoại cuộn trong thanh, không kéo cả trang.
- Tìm chuyến: áp dụng “thủy sản” ra chip và trạng thái không khớp; xóa bộ lọc về URL sạch. Trên 390, bộ lọc nâng cao được giấu sau “Hiện bộ lọc”.
- Chi tiết một chuyến đã nhận: tuyến, ô hàng, giá, xe và tài xế đã phân công.
- Chuyến của tôi: một form phân công cho đơn chưa gán; đơn đã gán không có nút phân công lần nữa. Mở hộp thoại xác nhận rồi bấm Hủy. Không có request phân công.
- Đội xe và danh sách tài xế hiện dữ liệu thật, huy hiệu đang mở / đã kích hoạt.

## Chưa xem trên trình duyệt

Sàn đang không có đơn `PUBLISHED`, nên chưa thấy thẻ đơn mở, so sánh hai đơn, hay hộp thoại nhận chuyến với dữ liệu thật. Không đăng nhập chủ hàng, tài xế hoặc quản trị để bấm logo từng vai trò; đích đó được kiểm bằng test thuần. Không gửi tin, không đặt lại mật khẩu, không thêm xe.

Nghiệm thu hình ảnh của người dùng chưa được đánh dấu đạt.

## Bổ sung sau review FE-05A, chưa nghiệm thu

Sàn người dùng chỉ còn `/carrier/tim-chuyen`. Không còn trang hoặc query xem trước thẻ mẫu. Thẻ đơn mở dùng `MarketShipmentCard` và `Xem đơn` tới `/carrier/chuyen/:id`.

Trang `/carrier` giữ ô tìm, nhóm nhiệt, số đơn đang mở, chuyến đang theo dõi và danh sách đã nhận. Bốn ô lối tắt trùng sidebar đã bỏ. Menu đội xe và tài xế vẫn ở sidebar.

Bộ lọc nâng cao thu trong “Bộ lọc khác”. Các tham số Core 13 vẫn còn. Chi tiết chuyến gom khối lượng, thể tích và số kiện khi cả ba đều trống, và không thêm chữ “Tài xế” nếu tên đã bắt đầu bằng chữ đó.

Bản đồ lấy → giao chưa có vì đơn không lưu tọa độ hai đầu. Không geocode và không dùng API vị trí của chủ hàng. Quyết định tài khoản làm sau nằm ở `docs/product/COLDI_v2.4_Product_Decisions_2026-10-17.md`. Checklist ảnh nằm ở `docs/frontend/FE-05A_Visual_Acceptance_and_Carrier_Backlog_2026-10-17.md`.
