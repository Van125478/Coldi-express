# Incident reporting MVP — technical handoff

Trạng thái: **READY FOR UAT**. Đây không phải nghiệm thu giao diện và không phải bản production.

Nguồn nghiệp vụ: COLDI Business Documentation v2.10 cùng INC-01 đến INC-04 trong CURRENT v2.8. Tài liệu v2.10 không bị sửa trong đợt này.

Nhánh triển khai độc lập từ `origin/main`. Không dùng mã Commission.

## Architecture

Sự cố là aggregate riêng, không đổi lifecycle của Shipment.

- `Incident` lưu nội dung, trạng thái chính, `escalationStatus`, phiên bản và khóa idempotency.
- `IncidentEvent` là audit append-only. Workflow thường không sửa hoặc xóa event.
- `IncidentNotification` là thông báo trong ứng dụng, dedupe theo `(eventId, recipientId)`.
- `IncidentReminderPolicy` là cấu hình nhắc việc, mặc định tắt.
- Cập nhật trạng thái là `findOneAndUpdate` có điều kiện `version + status + appliedKeys`. Cùng lần ghi, payload event được đẩy vào `pendingEvents`.
- Nếu process dừng sau khi document đã commit mà collection event chưa kịp ghi, lần đọc, retry cùng khóa, hoặc `reconcileIncidentArtifacts()` khi khởi động sẽ ghi event còn thiếu. Notification lỗi không xóa incident đã tạo.
- Không dùng transaction nhiều document vì CI MongoDB không có replica set.

`reporterId`, `reporterRole`, `carrierId` và `handlerId` lấy từ phiên đăng nhập và shipment trên server.

## State machine

Trạng thái chính: `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED`.

Phản đối kết quả: `RESOLVED → IN_PROGRESS`, bắt buộc lý do. Kết quả cũ nằm trong event `RESOLVED`.

`VEHICLE_ISSUE` được đóng từ `RESOLVED` bởi nhà xe đang nhận chuyến, ghi `CLOSED`. Đóng không xóa kết quả, comment, phản đối hay ảnh, và không đổi trạng thái chuyến.

Yêu cầu mở lại nằm ở `reopenStatus`, tách khỏi trạng thái chính. `PENDING_CARRIER` vẫn là `CLOSED`. Chỉ nhà xe hoặc quản trị được phân công (`handlerId`) được mở lại thành `IN_PROGRESS`. Loại sự cố khác vẫn nhận `403 incident_close_denied` / `incident_reopen_denied`.

Tạo sự cố đặt `OPEN`, ghi `reportedAt` theo giờ server, không đổi `shipment.status`.

## Authorization

| Vai trò | Tạo | Xem | Tiếp nhận / xử lý / kết quả | Đóng `VEHICLE_ISSUE` | Yêu cầu mở lại | Phản hồi / quyết định mở lại | Phản đối | Comment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shipper chủ đơn | Có, trong cửa sổ trạng thái bên dưới | Sự cố của đơn mình | Không | Không | Có khi `CLOSED` và `reopenStatus=NONE` | Không | Có khi `RESOLVED` | Có khi chưa `CLOSED` |
| Carrier đã claim | Có | Sự cố của chuyến đang claim | Có | Có khi `RESOLVED` | Không | Có khi `PENDING_CARRIER` còn hạn 48 giờ | Không | Có khi chưa `CLOSED` |
| Driver đang được gán | Có | Sự cố của chuyến đang được gán | Không | Không | Không | Không | Có nếu chính mình là người báo | Có khi chưa `CLOSED` |
| Driver cũ | Không | Chỉ sự cố do chính mình báo | Không | Không | Không | Không | Có với sự cố đó khi `RESOLVED` | Có với sự cố đó khi chưa `CLOSED` |
| Admin chưa được gán | Không | Không | Không | Không | Không | Không | Không | Không |
| Admin có `handlerId` trùng tài khoản | Không | Có | Không | Không | Không | Có khi `AWAITING_ADMIN` | Không | Không |
| Khách | 401 | 401 | 401 | 401 | 401 | 401 | 401 | 401 |

Sai tenant trả 404. Quyền kiểm tra ở backend.

Cửa sổ tạo, đọc thận trọng vì INC-REPORT-01 còn mở: chỉ `PUBLISHED`, `MATCHED`, `PICKUP_CONFIRMED`, `IN_TRANSIT`. `DELIVERY_CONFIRMED`, `COMPLETED`, `CANCELLED` bị từ chối. Đây là chặn an toàn, không phải chính sách cửa sổ đã duyệt. Sự cố đã mở trước khi giao hàng vẫn xử lý tiếp. Giao hàng không bị chặn vì đang có sự cố.

## Escalation

Enum `NONE | REQUESTED | ACTIVE | FINISHED | DECLINED` là đề xuất kỹ thuật, không phải quyết định nghiệp vụ đã duyệt. Validator giữ nguyên trạng thái chính. HTTP `/escalate` trả `403 incident_escalation_denied`.

## API

Tất cả nằm dưới `/api/incidents`. Mutating route yêu cầu cookie phiên, tài khoản đã đổi mật khẩu tạm, và `Origin` khớp `FRONTEND_ORIGIN` nếu header có mặt.

- `POST /api/incidents`
- `GET /api/incidents?limit&cursor&shipmentId&status`
- `GET /api/incidents/:id`
- `GET /api/incidents/:id/events`
- `POST /api/incidents/:id/comments`
- `POST /api/incidents/:id/acknowledge`
- `POST /api/incidents/:id/start`
- `POST /api/incidents/:id/resolve`
- `POST /api/incidents/:id/object`
- `GET /api/incidents/notifications`
- `GET /api/incidents/notifications/unread-count`
- `POST /api/incidents/notifications/:id/read`
- `POST /api/incidents/:id/close` — `VEHICLE_ISSUE` từ `RESOLVED`; loại khác 403
- `POST /api/incidents/:id/reopen-request`
- `POST /api/incidents/:id/reopen-response` — `decision=APPROVE|REJECT`
- `POST /api/incidents/:id/reopen-decision` — chỉ admin có `handlerId`
- `POST /api/incidents/:id/escalate` — 403
- `POST /api/incidents/:id/priority` — 403

Khóa idempotency: header `Idempotency-Key` hoặc field `idempotencyKey`, 8–80 ký tự `[A-Za-z0-9._:-]`. Mutation trạng thái cần `expectedVersion`. Sai phiên bản trả 409. Cùng khóa trả trạng thái hiện tại và không tạo event thứ hai.

Danh sách mặc định 20, tối đa 50, sort `updatedAt` giảm dần rồi `_id` giảm dần.

## Indexes

- Incident: `shipmentId`, `shipperId`, `reporterId`, `carrierId`, `handlerId`, `status`, `createdAt`/`updatedAt`, unique `(reporterId, idempotencyKey)`.
- Event: unique `(incidentId, idempotencyKey)`, sort `(incidentId, occurredAt, _id)`.
- Notification: unique `(eventId, recipientId)`, sort theo người nhận và `createdAt`.

Carrier và driver được đối chiếu lại với shipment hiện tại, không chỉ bản sao `carrierId` lúc báo.

## Audit và notification

Event lưu id, incident, action, actor, thời điểm, trạng thái trước/sau, escalation trước/sau, note, correlation id, visibility, idempotency key.

Action: `CREATED`, `ACKNOWLEDGED`, `INVESTIGATION_STARTED`, `COMMENT`, `RESOLVED`, `OBJECTED`, `CLOSED`, `REOPEN_REQUESTED`, `REOPEN_APPROVED`, `REOPEN_REJECTED_BY_CARRIER`, `REOPEN_ESCALATED_TO_ADMIN`, `ADMIN_REOPEN_APPROVED`, `ADMIN_REOPEN_REJECTED`.

Visibility `INTERNAL` không trả về API. Không có route tạo ghi chú nội bộ.

Thông báo chỉ tới shipper của đơn, carrier đang claim, driver đang được gán, người báo, và admin khi `handlerId` trùng người đó. Không gửi cho mọi carrier hoặc mọi admin. Payload chỉ có nhãn chung, không có số điện thoại, GPS hay ảnh. Mở link vẫn kiểm tra quyền.

Không email, SMS, push.

## Evidence

**BLOCKED.** Không có kho riêng và bước kiểm tra nội dung. Báo cáo chữ hoạt động. Field ảnh trả `400 incident_evidence_blocked`. API luôn trả `attachments: []`. UI chỉ có câu ghi chú, không có ô upload.

Giới hạn độ dài tiêu đề 5–120 và mô tả 20–2000 là validation kỹ thuật, không phải luật thương mại đã duyệt.

## Reminders

Bốn kind: `ACK_PENDING`, `PROGRESS_PENDING`, `ESCALATION_PENDING`, `RESOLUTION_FEEDBACK_PENDING`. Document tạo ra có `enabled: false`. Không hardcode SLA. Evaluator thuần trả rỗng khi tắt. Không có cron.

## 48-hour reopen escalation

Hạn nhà xe = `reopenRequestedAt` (giờ server, UTC) + 48 giờ. Hiển thị `Asia/Ho_Chi_Minh`.

Nếu nhà xe không phản hồi trước hạn, `reopenStatus` thành `AWAITING_ADMIN`, event `REOPEN_ESCALATED_TO_ADMIN`, actor `SYSTEM`, khóa `reopen-timeout:<reopenRequestId>`. Quét khi đọc, khi khởi động và mỗi phút. Cùng khóa không tạo event hoặc thông báo thứ hai. Phản hồi đúng hạn chặn escalation.

Không có cơ chế đã duyệt để gán `handlerId`. Escalation chỉ lưu trạng thái an toàn; admin chưa được gán vẫn không thấy case. Đây là blocker INC-TRIAGE-01.

## Recovery

`reconcileIncidentArtifacts()` chạy sau khi API kết nối MongoDB. Nó bổ sung event `CREATED` còn thiếu và event nằm trong `pendingEvents`, rồi bù notification. Đọc chi tiết cũng chạy bước này cho một case. `startReopenEscalationSweeper()` quét hạn 48 giờ.

## UI

- `/shipper/su-co`, `/carrier/su-co`, `/driver/su-co`
- `/.../su-co/moi?shipmentId=`
- `/.../su-co/:id`
- Nút báo sự cố trên chi tiết chuyến khi trạng thái còn trong cửa sổ kỹ thuật.
- Tài xế thấy nhắc chỉ báo khi xe đã dừng. Không có hộp thoại chặn lúc đang chạy.

Chưa có browser UAT của Product Owner. Không đánh dấu ACCEPTED.

## Isolation

Tạo hoặc chuyển sự cố không ghi Shipment, không đặt status `INCIDENT`, không hủy chuyến, không dừng GPS, không nhả xe, không bỏ tài xế, không đổi giá, không đổi gói, không import commission.

## Open decisions — BLOCKED BY POLICY

- INC-CLOSE-01: đã duyệt cho `VEHICLE_ISSUE` (nhà xe đang nhận chuyến, từ `RESOLVED`). Loại khác vẫn bị từ chối đóng.
- INC-REPORT-01: cửa sổ sau giao hàng.
- INC-MEDIA-01: số ảnh, dung lượng, nhà cung cấp, retention. UI chọn ảnh là trình bày; backend ảnh không đổi.
- INC-PRIORITY-01: ngưỡng ưu tiên.
- INC-REMINDER-01: chu kỳ nhắc.
- INC-TRIAGE-01: **blocker**. Không có chính sách gán quản trị khi mở lại bị từ chối hoặc quá 48 giờ. Không mở visibility toàn cục cho mọi Admin.

## Tests

`server/tests/incidentLifecycle.test.ts`, `server/tests/incident.test.ts` và `server/tests/incidentReopen.test.ts`.

Đối chiếu Commission ledger **NOT RUN** vì Commission chưa ở trên `main`. Test chỉ xác nhận process không đăng ký model commission và không đổi giá chuyến.

## QA local

Database: `coldi_incident_qa_20261018`. API `127.0.0.1:4300`. Web `127.0.0.1:5390`.

Không dùng database `coldi`, Package QA hoặc Commission QA.

```powershell
$env:PORT="4300"
$env:MONGODB_URI="mongodb://127.0.0.1:27017/coldi_incident_qa_20261018"
$env:FRONTEND_ORIGIN="http://127.0.0.1:5390"
$env:NODE_ENV="development"
$env:AUTH_SECRET="local-incident-qa-auth-secret-20261018"
$env:APP_RUNTIME_MODE="development"
$env:PACKAGE_DEMO_SELF_ACTIVATION_ENABLED="false"
$env:INCIDENT_QA_PASSWORD="<mật khẩu QA cục bộ, không commit>"
npx tsx src/scripts/seedIncidentQa.ts
npx tsx src/index.ts
```

Web, tại thư mục `web`:

```powershell
$env:VITE_API_ORIGIN="http://127.0.0.1:4300"
npx vite --host 127.0.0.1 --port 5390 --strictPort
```

Mở `http://127.0.0.1:5390/dang-nhap`. Không dùng `localhost` vì Origin phải khớp.

Seed tạo shipper, carrier, driver và một shipper không có quyền. Các sự cố mẫu được tạo bằng service thật.
