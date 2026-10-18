# COLDI v2.6 — API contract & RBAC DRAFT (NOT IMPLEMENTED)

**Cảnh báo cho developer:** các endpoint ở bảng này chỉ là **đề xuất**, không được sử dụng trong frontend như thể đã tồn tại. Phải ký business rules và API design mới được triển khai. Tham chiếu existing routes ở [Architecture](01_ARCHITECTURE_v2.6.md).

## 1. Catalog/Subscription/Entitlement

| HTTP | Endpoint dự kiến | Auth & ownership | Tác dụng |
| --- | --- | --- | --- |
| GET | `/api/plans?audience=SHIPPER|CARRIER` | Public read published plans | Danh sách giá/rate/quyền được công bố |
| GET | `/api/my-plan` | Auth Shipper/Carrier | Gói đang active, entitlement, quota, thời hạn |
| POST | `/api/my-plan/requests` | Auth đúng account | Yêu cầu nâng gói; không kích hoạt paid ngay |
| GET | `/api/admin/plan-requests` | Permission `package.request.review` | Danh sách request nội bộ |
| POST | `/api/admin/plan-requests/:id/approve` | Permission `package.request.approve` | Manual assign + audit + reason/evidence ref |
| POST | `/api/admin/plan-requests/:id/reject` | Permission tương ứng | Reject + reason |
| POST | `/api/admin/plans` | Permission `package.catalog.write` | Tạo plan definition version (draft) |

FE hiển thị `used` và `remaining` chỉ khi quota định lượng đã được duyệt. Không có hard-limit Shipper mặc định. Role Admin hiện không có các permissions ở trên — phải implement riêng.

## 2. Commission quote & report

| HTTP | Endpoint dự kiến | Auth | Tác dụng |
| --- | --- | --- | --- |
| GET | `/api/shipments/:id/fee-quote` | Shipper chủ đơn | Preview B/F_s/B+F_s, trạng thái quote |
| GET | `/api/carrier/shipments/:id/fee-quote` | Carrier được quyền xem/claim theo policy | Preview B/F_c/B−F_c |
| GET | `/api/my/commissions` | Shipper/Carrier tự xem | Lịch sử phí của chính mình |
| GET | `/api/admin/commission-audit` | Explicit accounting permission | Internal audit, không cấp GPS |

**Response fields đề xuất**: `shipmentId`, `payerSide`, `baseFreightVnd`, `planCode`, `planVersion`, `commissionRateBps`, `commissionAmountVnd`, `netOrTotalVnd`, `status`, `snapshotAt`, `policyVersion`, `currency`, `isCollected:false/unknown`. Không trả Shipper commission vào response Carrier/Marketplace public một cách mặc định.

## 3. World Oil Prices

`GET /api/market/oil-prices` — có thể public theo decision: trả `[{ benchmark: 'BRENT'|'WTI', price, currency:'USD', unit:'barrel', observedDate, fetchedAt, source, stale }]` hoặc trạng thái `unavailable`; không có endpoint nhập nhiên liệu xe. Nếu giá chưa có, không nhét giá 0. API provider secret chỉ server. Tài liệu EIA ở [Oil Price](../product/05_WORLD_OIL_PRICE_v2.6.md).

## 4. Incidents

| HTTP | Endpoint dự kiến | RBAC |
| --- | --- | --- |
| POST | `/api/shipments/:id/incidents` | Driver assigned / Carrier claimed (Shipper pending decision) |
| GET | `/api/shipments/:id/incidents` | Owner Shipper / winning Carrier / assigned Driver according visibility |
| GET | `/api/incidents/:incidentId` | Same object policy |
| POST | `/api/incidents/:id/actions` | Carrier reviewer / authorized Admin assigned |

Request phải validate transition, server timestamp, title/type/description, idempotency. Internal notes phải filter ở backend. Không POST chuyển shipment.status sang INCIDENT. Không trả all incidents toàn platform cho Admin mặc định.

## 5. Mã lỗi & response convention (DRAFT)

- `401 unauthenticated`: chưa đăng nhập.
- `403 forbidden`: sai role/permission trên route.
- `404 not_found`: resource khác chủ thể khi cần tránh leak.
- `409 already_claimed / plan_limit_exceeded / transition_conflict / duplicate_request`: mã business cụ thể theo endpoint.
- `422 invalid_input / invalid_plan`: validation (nếu chuẩn error handler đã duyệt).
- `503 market_data_unavailable`: không có provider/cache valid; nếu có cache trả stale 200 theo policy.

HTTP status/mã cuối cùng phải thống nhất với error contract hiện có. Không hứa status cụ thể trước source implementation.
