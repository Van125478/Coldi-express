# COLDI v2.6 — UX text & empty/error states (DRAFT)

Tất cả ví dụ dưới đây là **đề xuất câu chữ**, không chứng minh UI đã triển khai. Không gắn nhãn 'Đã thanh toán' khi chỉ xác nhận giao hàng.

| Màn/Trạng thái | Câu hiển thị đề xuất |
| --- | --- |
| Bảng giá chưa duyệt | `Mức phí đang được COLDI dự kiến. Thông tin chính thức sẽ được cập nhật trước khi mở bán.` |
| Gói Enterprise chưa có rate | `Liên hệ COLDI để nhận báo giá và mức phí theo hợp đồng.` |
| Shipper xem phí trước đăng đơn | `Cước niêm yết: {B}. Phí dịch vụ COLDI của bạn ({rate}%): {F_s}. Tổng dự kiến: {B+F_s}.` |
| Carrier xem phí trước Claim | `Cước niêm yết: {B}. Phí dịch vụ COLDI của bạn ({rate}%): {F_c}. Giá trị ròng dự kiến: {B-F_c}.` |
| Giải thích hai phía | `COLDI có thể thu phí dịch vụ riêng từ Chủ hàng và Nhà xe theo gói tương ứng. Các khoản được thông báo trước khi xác nhận.` |
| PlanRequest pending | `Yêu cầu nâng gói đã được tiếp nhận. Quyền lợi mới chưa được kích hoạt.` |
| Admin activation | `Gói đã được kích hoạt theo xác nhận nội bộ. Thao tác này không đồng nghĩa hệ thống đã thu tiền online.` |
| Usage cap exceeded | `Bạn đã đạt giới hạn của gói hiện tại. Dữ liệu đã lưu được giữ nguyên. Xem gói khác để tiếp tục thao tác này.` |
| Gói hết hạn khi đang có chuyến | `Gói dịch vụ đã hết hạn. Các chuyến đang thực hiện không bị hủy tự động.` |
| Phí dự kiến sau giao | `Đã xác nhận giao hàng. Phí dịch vụ đang ở trạng thái ghi nhận, chưa phải đã thanh toán.` |
| Dầu có số mới | `Giá dầu thô thế giới — Brent: {price} USD/thùng. Dữ liệu ngày {observedDate}. Nguồn: {source}.` |
| Dầu stale | `Đang hiển thị giá mới nhất đã được công bố ngày {observedDate}. Chưa có dữ liệu mới hơn.` |
| Dầu unavailable | `Chưa tải được giá dầu thế giới. Vui lòng thử lại sau.` |
| Dầu disclaimer | `Giá tham khảo quốc tế, không phải giá dầu diesel bán lẻ tại Việt Nam.` |
| Sự cố tạo thành công | `Đã ghi nhận báo cáo sự cố cho chuyến này.` |
| Sự cố đang xử lý | `Sự cố đang được Nhà xe xử lý. Trạng thái vận chuyển không tự động thay đổi.` |
| Sự cố lỗi gửi | `Không gửi được báo cáo. Nội dung đã nhập vẫn được giữ để bạn thử lại.` |
| Không có incident | `Chuyến này chưa có báo cáo sự cố.` |

**Không hiển thị:** 'GPS trực tiếp' khi dữ liệu stale/ended; 'phí đã thu' khi chưa đối soát; 'đã mua gói Pro' khi PlanRequest chỉ pending; số USD/barrel fake; biểu đồ doanh thu/chi phí giả; 'đã xử lý sự cố' khi chưa có action server.
