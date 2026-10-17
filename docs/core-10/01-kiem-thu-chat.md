# Kiểm thử tay Core 10 — Chat theo đơn

Chưa chạy buổi bấm tay này. Không tạo hội thoại trên cơ sở dữ liệu development trong lúc cài đặt.

Không dùng hai đơn đã nghiệm thu:

- `6ad25c2fcf4c13c7d5b735dc`
- `6ad2fc6b0f1e6b36c1404649`

## Quy tắc

Chủ hàng của đơn và từng nhà xe có một cuộc trao đổi riêng, khóa theo đơn và nhà xe. Hai nhà xe không đọc tin của nhau. Tài xế và chủ hàng khác không vào hội thoại. Tin nhắn không nhận chuyến, không giữ chỗ, không đổi giá, không thêm mốc timeline và không ghi GPS.

Sau khi một nhà xe nhận chuyến, nhà xe thua không gửi thêm tin. Tin cũ của nhà xe đó vẫn còn và chỉ đọc. Nhà xe thắng vẫn trao đổi được với chủ hàng. Quy tắc đóng hội thoại của bên thua là tạm thời, vì tài liệu chưa chốt vòng đời tin trước Claim.

Chưa có thời hạn xóa tin. Không có tệp đính kèm. Nội dung chat không phải cam kết giá có hiệu lực pháp lý.

## API

- `POST /api/carrier/conversations/by-shipment/:shipmentId`
- `GET /api/carrier/conversations/:conversationId/messages?after=`
- `POST /api/carrier/conversations/:conversationId/messages`
- `GET /api/shipments/:shipmentId/conversations`
- `GET` và `POST /api/shipments/:shipmentId/conversations/:conversationId/messages`

Máy chủ lấy người gửi từ phiên đăng nhập. Tin lưu theo số thứ tự tăng trên từng hội thoại. Trang chat hỏi tin mới khoảng 5 giây khi đang mở và đang hiện, rồi dừng khi rời trang. Đây không phải WebSocket.

Tin trống hoặc dài hơn 2000 ký tự bị từ chối. Chưa có giới hạn tần suất dùng được cho production.

## Các bước bấm tay

Dùng một đơn mới.

1. Chủ hàng đăng đơn. Trạng thái “Đang tìm xe”.
2. Nhà xe mở đơn trên sàn và bấm “Nhắn chủ hàng”, rồi “Mở trao đổi”.
3. Nhà xe gửi một tin trước khi nhận chuyến.
4. Chủ hàng mở đơn, thấy đúng tên nhà xe, đọc và trả lời.
5. Nhà xe thấy lời trả lời. Tải lại trang, tin vẫn còn.
6. Đơn vẫn “Đang tìm xe”. Nút “Nhận chuyến” vẫn bấm được.
7. Nhà xe bấm “Nhận chuyến”. Trạng thái thành đã có nhà xe nhận.
8. Tin cũ vẫn đúng cuộc trao đổi. Timeline chỉ thêm mốc nhận chuyến, không có mốc chat.
9. Nếu có nhà xe thứ hai an toàn để thử, nhà xe đó không đọc được tin của nhà xe thắng và không gửi thêm sau khi đơn đã được nhận.
10. Tài xế không thấy hội thoại thương lượng.

Test API nằm ở `server/tests/chat.test.ts`, cơ sở `coldi_chat_test`. Buổi bấm tay là thao tác trên giao diện, không thay cho test đó.
