# MVP-03 — Câu lịch sử phân công giữ tên lúc gán

Ngày sửa: 2026-10-17. Nhánh `feature/cinematic-scroll`. HEAD vẫn `69ec1a198f0729efc10a3d534dd92d264b1738eb`. Không commit, không push, không seed, không ghi database phát triển `coldi`.

## Lỗi gốc

Sau khi nhà xe đổi tên xe, câu của event `ASSIGNED` đã có đổi theo tên mới. Cùng cơ chế xảy ra với tên hiển thị tài xế.

Quan hệ gán vẫn đúng `vehicleId` và `driverId`. Status đơn không đổi. Sửa đội xe không thêm mốc timeline. Chỉ câu chữ lịch sử bị viết lại lúc đọc.

## Nguyên nhân trong mã

Event `ASSIGNED` trước đây chỉ lưu id. `toDto` trong `server/src/shipments/shipmentEvents.ts` đọc `Vehicle.label` và `User.displayName` tại thời điểm GET. `PATCH` đội xe sửa đúng hai field đó, nên lần đọc sau ghép câu mới.

## Snapshot lúc gán

Schema event của đơn thêm hai field tùy chọn:

- `assignedVehicleLabel`, tối đa 160 ký tự, cùng giới hạn tên xe
- `assignedDriverName`, tối đa 80 ký tự, cùng giới hạn tên hiển thị tài xế

Không thêm loại event. Không thêm status.

`POST /api/carrier/shipments/:id/assign` vẫn tải xe và tài xế thuộc đúng `carrierId` trước khi ghi. Tên đưa vào event lấy từ hai bản ghi server đó, sau khi `trim`. Tên rỗng không được ghi. Body client không có trường tên để ghi vào event.

Hai tên nằm trong cùng pipeline `findOneAndUpdate` với `vehicleId`, `driverId` và event `ASSIGNED`. Sequence vẫn là `$size + 1`. `occurredAt` vẫn là thời điểm server chấp nhận gán.

Khi đọc, câu `ASSIGNED` ưu tiên tên đã lưu. Không có tên đã lưu thì mới tra cứu hiện tại. Không tra được thì câu dùng “đã phân công”.

## Đơn cũ

Event tạo trước lần sửa này không có hai field mới. Chúng vẫn đọc được. Câu của chúng tiếp tục theo tên hiện tại của xe và tài xế, vì đó là hành vi tra cứu cũ, không phải snapshot lịch sử.

Không migration. Không viết lại hai đơn đã nghiệm thu `6ad25c2fcf4c13c7d5b735dc` và `6ad2fc6b0f1e6b36c1404649`.

## Phần không đổi

`vehicleId` và `driverId` trên đơn và trên event vẫn là định danh. Sửa đội xe không tạo event. Claim, gán, lấy hàng và giao hàng giữ điều kiện status cũ. Gán lặp hoặc gán đồng thời vẫn không tạo event `ASSIGNED` thứ hai.

## Chứng cứ test

Database chỉ là `coldi_integration_test`, cùng hàng rào tên với MVP-02.

`assignment keeps the vehicle and driver names from that moment`

- Gán tạo đúng một event `ASSIGNED`.
- Câu là `Xe Xe trước khi đổi tên. Tài xế Tài xế tích hợp.`
- Document lưu `assignedVehicleLabel` và `assignedDriverName` đúng hai tên đó.
- Sau khi sửa tên xe và tên tài xế, câu GET không đổi.
- Đơn vẫn `MATCHED`, đúng `vehicleId` và `driverId`.
- Timeline vẫn ba event: đăng, nhận, gán.
- Gán lần hai trả 409.

`legacy assignment events without a snapshot keep the current lookup`

- Event không có snapshot vẫn hiện tên xe đang lưu.
- Sau khi tên xe đổi, câu của event cũ đổi theo tên hiện tại.
- GET không thêm event.
- Event trỏ id không còn bản ghi trả 200 với câu `Xe đã phân công. Tài xế đã phân công.`

`assignment.test.ts` vẫn giữ ca gán đồng thời: một cặp xe và tài xế, không nhân event.

## Hồi quy

Server, ngày 2026-10-17:

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm test`: 51 tests, 51 pass, 0 fail
- `npm run build`: pass

Mốc trước lượt này là 50 pass. Thêm một ca đơn cũ và id mất. Ca đổi tên cũ được viết lại thành ca snapshot, nên không cộng thêm một test nữa.

Web:

- `npm run lint`: pass
- `npx tsc -b`: pass, nằm trong `npm run build`
- `npm run build`: pass

Không sửa component timeline. Câu hiển thị vẫn là `detail` từ API. Không mở trình duyệt.

## Giới hạn còn lại

Event `ASSIGNED` tạo trước khi có hai field snapshot vẫn đổi câu khi xe hoặc tài xế đổi tên. Không có cách biết tên lúc gán nếu tên đó chưa từng được lưu.

Tên người thực hiện event, ở cột actor, vẫn đọc từ hồ sơ hiện tại. Lần này chỉ khóa câu phân công.

Cửa sổ mất audit giữa ghi đơn và ghi log không đổi. Live Map, tài chính và tenant không nằm trong lượt này.
