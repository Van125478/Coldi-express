# Core 13 — Phạm vi sàn tìm chuyến

Nguồn nghiệp vụ: Coldi Master Const v2.3 mục 2.2, mục 4, mục 8, Phụ lục E và Phụ lục G; UI/UX Spec phần Carrier Home, Load Board, chi tiết đơn và xác nhận Claim.

Đây là marketplace chức năng trên luồng Claim hiện có. Không phải bản thiết kế lại giao diện WOW. Prototype, ảnh tham chiếu và widget tài chính không được nâng thành quy tắc nghiệp vụ.

| Hạng mục | Nguồn v2.3 | MVP / Prototype / Pending | Triển khai | Kiểm chứng |
| --- | --- | --- | --- | --- |
| Carrier Home | Phụ lục E2 | MVP cho tìm chuyến, đội xe, feed; Prototype cho giá dầu và tiệm sửa xe | Ô tìm kiếm, lối vào Tìm chuyến, Quản lý xe, Chuyến của tôi, banner chuyến đang theo dõi nếu có dữ liệu, feed đơn PUBLISHED | API feed dùng lại Load Board. Giao diện chưa nghiệm thu tay |
| Search | Mục 2.2, Phụ lục E | MVP trên tên hàng, điểm lấy, điểm giao | `q` đã trim, không phân biệt hoa thường, giữ Unicode tiếng Việt. Không bỏ dấu | `marketplace.test.ts` |
| Filters | Mục 2.2 | MVP khi dữ liệu có nghĩa | Nhóm nhiệt, đoạn điểm lấy, đoạn điểm giao, khoảng tải trọng, khoảng ngày lấy | `marketplace.test.ts` |
| Sorting | Mục 2.2, Phụ lục E | MVP | Mới đăng, thời gian lấy, cước niêm yết thấp đến cao, tải trọng nặng đến nhẹ | `marketplace.test.ts` |
| Comparison | Mục 2.2 | MVP đọc, chưa có workflow lưu | Chọn tối đa hai chuyến trên trình duyệt hiện tại | Chưa có API. Không đổi trạng thái |
| Shipment cards | Phụ lục E | MVP | Hàng, tuyến, nhiệt độ, tải trọng, xe yêu cầu, lịch lấy, cước niêm yết, trạng thái | DTO carrier hiện có |
| Contact và Chat | Mục 4, Phụ lục E | MVP | Gọi bằng `tel:` khi có số. Chat Core 10 trên chi tiết | Chat test cũ và test Core 13 |
| Claim | Phụ lục E3 | MVP | Popup xác nhận, chỉ xác nhận mới gọi Claim nguyên tử cũ | Claim test cũ và test tranh chấp Core 13 |
| Bookmark | Phụ lục E3 nói bookmark không Claim | Pending cho lưu theo tài khoản | Không có API lưu. So sánh tạm không giữ chỗ | Route bookmark giả trả 404, đơn vẫn PUBLISHED |
| API và bảo mật | Mục 4, Core 12 | MVP theo quan hệ vai trò, chưa phải multi-tenant tổ chức | Allowlist query, chỉ PUBLISHED và chưa có nhà xe | `marketplace.test.ts`, security test cũ |
| Responsive UI | Mục 8, rộng 390px | MVP chức năng | Lưới, nút cao khoảng 44px, so sánh xếp chồng | Chưa đo trên trình duyệt |

## Hành vi đã chốt trong code

Tìm kiếm cắt khoảng trắng đầu cuối. Khớp không phân biệt hoa thường trên `cargoDescription`, `pickupLocation` và `deliveryLocation`. `thủy sản` khớp `Thủy sản`. `thuy san` không khớp `Thủy sản`. Chưa có tìm không dấu.

Bộ lọc không đặt khoảng mặc định. Thiếu tải trọng hoặc thiếu ngày lấy thì đơn đó không lọt vào lọc theo tải trọng hoặc ngày, và cũng không bị gán số giả. Nhóm nhiệt chỉ `COOL` Lạnh mát, `FROZEN` Đông, `DEEP_FROZEN` Cực lạnh.

Sắp xếp hòa thì dùng `_id` tăng dần, riêng Mới đăng dùng `_id` giảm dần. Đơn thiếu ngày lấy hoặc tải trọng đứng cuối ở hai kiểu sắp xếp tương ứng. Cước niêm yết sắp thấp đến cao. Tải trọng sắp nặng đến nhẹ.

API không gửi `sort` giữ thứ tự cũ: `createdAt` tăng dần rồi `_id` tăng dần. Màn Tìm chuyến mặc định gửi `sort=newest`.

Mỗi phản hồi lấy tối đa 500 đơn khớp rồi trả 100 đơn đầu sau khi sắp xếp. `total` là số khớp. `truncated` là true khi còn đơn ngoài 500 đơn đã đọc. Chưa phân trang tiếp.

So sánh chỉ nằm trong state của trang. Tải lại trang là mất. Không ghi cơ sở dữ liệu, không Claim, không đổi giá, không ghi Timeline.

Claim trên danh sách và chi tiết mở hộp thoại trước. Mở hộp thoại không gửi request. Xác nhận mới gọi `POST /api/carrier/shipments/:id/claim`. Nút xác nhận bị khóa khi đang gửi. Thành công chỉ hiện sau phản hồi server. 409 hiện xung đột và tải lại danh sách. Không gán xe hay tài xế tự động.

## Giới hạn

Không có khoảng cách, ETA, điểm kho, điểm phù hợp, giá thương lượng, giảm giá, tạm ứng, công nợ, VAT, escrow hay hạn mức. Ảnh có các mục này được giữ ở mức tham chiếu.

Giá dầu, tiệm sửa xe, ảnh hàng, huy hiệu đã xác minh, đánh giá nhà xe và lưu tin vĩnh viễn không được dựng thành nút hoạt động.

Chưa có tenant tổ chức. Quyền vẫn là vai trò cộng quan hệ đơn hàng như Core 12.

## Bổ sung giao diện, không đổi allowlist

Sàn phát hành là một route `/carrier/tim-chuyen`. Thẻ mẫu và query xem trước bố cục không còn trong UI. Bộ lọc trên trang gồm ô tìm, nhóm nhiệt, sắp xếp, rồi “Bộ lọc khác” cho điểm lấy, điểm giao, tải trọng và khoảng ngày. `searchFromForm` vẫn chỉ ghi các khóa đã có. API vẫn từ chối khóa lạ.

0 đơn PUBLISHED là trạng thái trống. Lỗi tải là trạng thái khác, có nút thử lại. Chưa có đơn PUBLISHED trên database phát triển để bấm lưới ba cột hay `Xem đơn` của đơn đang mở. Không tạo đơn giả để chụp màn hình.

Bản đồ tuyến lấy → giao không thuộc API sàn. Địa chỉ đang là chữ. Không tự geocode, không vẽ tuyến, không tính khoảng cách hay ETA. Vị trí xe không được đưa sang nhà xe.

Đăng ký công khai, dấu xác thực doanh nghiệp và role WAREHOUSE không thuộc Core 13. Các quyết định đó được ghi ở `docs/product/COLDI_v2.4_Product_Decisions_2026-10-17.md` và chưa có trong code.
