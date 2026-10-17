# MVP-02 — Kết quả kiểm thử tích hợp

Ngày chạy: 2026-10-17. HEAD vẫn `69ec1a198f0729efc10a3d534dd92d264b1738eb`. Không commit.

## Database

Suite mới chỉ dùng `coldi_integration_test`.

Trước khi nối, test từ chối nếu `MONGODB_URI` gốc không phải database `coldi` local hoặc chính `coldi_integration_test`. Sau khi đổi pathname, tên kết nối phải đúng `coldi_integration_test`. `dropDatabase` chỉ chạy khi `mongoose.connection.name` khớp tên đó. Các tên `coldi`, `admin`, `local`, `config` bị chặn. Không chạy `seed:demo`, `seed:fleet`, hay `reset:demo-passwords`.

Hai đơn đã nghiệm thu không nằm trong fixture. Fixture dùng email `*.integration-test@coldi.local`.

## Kịch bản tự động đã chạy

`server/tests/integration.test.ts`

1. Chủ hàng, nhà xe, tài xế và các tài khoản đối chiếu đăng nhập bằng cookie phiên.
2. Body đăng đơn có `shipperId` giả bị 400.
3. Chủ hàng đăng đơn. Trạng thái `PUBLISHED`, một event `PUBLISHED`.
4. Nhà xe tìm trên sàn bằng chữ có dấu, khoảng trắng và nhóm nhiệt. Đơn không đổi trạng thái, không đổi giá, không thêm event.
5. JSON sàn không có nội dung chat, `latitude`, `shipperId`, email riêng, hay chữ `audit`.
6. Claim kèm `carrierId` giả bị 400. Đơn vẫn `PUBLISHED`.
7. Nhà xe mở chat, gửi một tin. Chủ hàng đọc và trả lời. Nhà xe kia đọc thread nhận 404.
8. Sau chat, đơn vẫn `PUBLISHED`, giá không đổi, `carrierId` vẫn trống.
9. Nhà xe thắng Claim. Nhà xe kia nhận 409. Đúng một audit `SHIPMENT_CLAIMED`.
10. Tạo xe và sửa tên xe. Đơn vẫn `MATCHED`, chưa có `vehicleId` hay `driverId`.
11. Nhà xe kia gán xe của mình nhận 403. Gán tài xế của nhà xe khác nhận 400.
12. Gán đúng xe và tài xế liên kết. Status vẫn `MATCHED`, nhãn “Chờ lấy hàng”.
13. Tài xế được gán thấy chuyến. Tài xế khác xác nhận lấy nhận 404.
14. Lấy hàng chuyển `IN_TRANSIT`. Bấm lại trả 200 và vẫn một event `PICKUP_CONFIRMED`.
15. Tài xế khác gửi GPS nhận 404. Vĩ độ 95 nhận 400 và chưa lưu điểm nào.
16. GPS hợp lệ được chủ hàng đọc lại. GPS cũ hơn nhận 409 và không ghi đè. Status vẫn `IN_TRANSIT`. Chủ hàng khác nhận 403.
17. Giao hàng chuyển `DELIVERY_CONFIRMED`. Bấm lại không thêm event. GPS sau giao nhận 409 và không đổi tọa độ.
18. Timeline đúng năm mốc: `PUBLISHED`, `CLAIMED`, `ASSIGNED`, `PICKUP_CONFIRMED`, `DELIVERY_CONFIRMED`.
19. Audit thành công đủ năm action đơn, cộng `VEHICLE_CREATED` và `VEHICLE_UPDATED`. Audit không chứa nội dung chat hay vĩ độ.
20. Đơn đã giao không còn trên sàn.

`two carriers racing for a second shipment still produce one winner`: một 200, một 409, một audit thắng.

Ca đổi tên xe trong file này đã được thay bằng ca snapshot ở MVP-03. Kết quả cũ “câu đổi theo tên mới” không còn đúng với lần gán mới. Xem `08-timeline-history-fix.md`.

`server/tests/marketplaceForm.test.ts` gọi hàm thật của web: cắt khoảng trắng, đổi dấu phẩy thập phân, giữ sort, và chặn khoảng tải trọng ngược trước khi tạo query.

## Lỗi tích hợp

Không có bước nào trong chuỗi trả mã hoặc trạng thái khác quy tắc đã duyệt. Không sửa route, DTO, hay hàm service.

## Sửa mã

Không có. Chỉ thêm test và gắn hai file vào lệnh `npm test` của server.

## Hồi quy đã chạy trong lượt này

Server:

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm test`: 50 tests, 50 pass, 0 fail
- `npm run build`: pass

Web:

- `npm run lint`: pass
- `npx tsc -b`: pass, nằm trong `npm run build`
- `npm run build`: pass

45 test cũ vẫn pass. Năm test mới là ba ca tích hợp và hai ca form sàn.

## Timeline

Mục này ghi kết quả tại thời điểm MVP-02. MVP-03 đã lưu tên xe và tên tài xế trên event lúc gán. Event cũ không có hai field đó vẫn đọc tên hiện tại. Chi tiết và số test mới nằm ở `08-timeline-history-fix.md`.

## Audit

Đường đi bình thường tạo đủ bản ghi success sau publish, claim, assign, pickup, delivery, tạo xe và sửa xe.

`recordSuccessfulAudit` vẫn nuốt lỗi insert, trừ trùng khóa 11000. Ghi đơn và ghi audit không nằm trong một transaction. Nếu process chết sau khi đơn đã lưu và trước khi audit được insert, nghiệp vụ còn và audit mất. Lượt này không thêm queue hay transaction, và không đổi phản hồi thành công của nghiệp vụ.

## Trình duyệt

NOT RUN. Web không có runner test giao diện. Không mở trình duyệt, không đụng database phát triển.

Đối chiếu mã: `shipmentService.ts` trỏ đúng các route vừa được suite gọi. `RoleGate` chuyển khách ra đăng nhập. `ClaimConfirm` chỉ gọi xác nhận khi bấm nút xác nhận. Panel GPS tài xế gắn khi `IN_TRANSIT`. Chủ hàng poll vị trí. Đội xe có route `/carrier/doi-xe`.

## Live Map

MVP-04 thêm `server/tests/mapboxMap.test.ts`. Suite đó kiểm tra thứ tự kinh độ–vĩ độ, tọa độ hỏng, token `pk.`, trạng thái cũ hoặc đã giao, và việc một lần poll không tạo map mới. Không mở tile Mapbox và không dùng token thật. Chi tiết ở `09-mapbox-live-map.md`.

## Quyết định còn mở

Tenant, tạo tài khoản tài xế, xóa xe, retention chat và GPS, nhà xe thua còn được đọc chat, hạn audit, bookmark, hủy/gán lại/`COMPLETED`, và tài chính. Không bịa chính sách nào trong test.
