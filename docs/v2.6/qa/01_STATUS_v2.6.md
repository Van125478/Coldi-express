# COLDI v2.6 — Ma trận trạng thái MVP

**Baseline đọc source:** `main` `7d07e941ace1d3490996c53a6bed36478a6d4836` (sau PR #3). **Automated test:** Cursor báo clean-clone integration `5d2c797` 71/71 backend PASS, frontend lint/typecheck/build PASS; **bản docs v2.6 này không tự chạy lại test ở main**. Không có biên bản browser FE-05B, Mapbox tile/marker.

| Hạng mục | Code | Automated | Browser UAT | Product policy |
| --- | --- | --- | --- | --- |
| Auth & role guards | Có | Có tests theo báo cáo | Pending full UAT | Core đã chốt |
| Shipper Publish/Mine/Detail | Có | Có | Pending | Core đã chốt |
| Carrier Marketplace/Chat/Claim | Có | Có | Persisted chat/Claim UAT pending | Core đã chốt |
| Carrier assign/fleet/driver accounts | Có | Có | Core14 browser pending | Core đã chốt |
| Driver Pickup/GPS/Delivery | Có | Có | QA end-to-end pending | Core đã chốt |
| GPS read Shipper/Carrier + Mapbox | Có route/map component | Có RBAC/helper tests | Real tiles/marker pending | Read permission đã chốt |
| Subscription catalog & information | Chưa | Không | Chưa | MVP REQUIRED; pricing đề xuất |
| Package entitlement & quota | Chưa | Không | Chưa | MVP REQUIRED; limit chi tiết OPEN |
| Admin package approval | Chưa (`/admin` placeholder) | Không | Chưa | Flow PROPOSED |
| Shipper & Carrier fee quote/commission | Chưa | Không | Chưa | **Hai phía APPROVED direction**, calculations PROPOSED |
| **Giá dầu thô thế giới** | Chưa có Market Data API/UI | Không | Chưa | MVP REQUIRED; user clarified scope |
| Báo cáo sự cố | Chưa có Incident workflow | Không | Chưa | MVP REQUIRED; flow DRAFT |
| Online payment | Chưa | Không | Chưa | AFTER MVP |
| Full v2.6 MVP | CHƯA | CHƯA | CHƯA | NOT COMPLETE |

**Không có module ghi lần đổ dầu/tiêu hao xe trong MVP v2.6.** Không coi `shipment.status` enum `INCIDENT` là Incident Reporting. Không coi bảng gói mockup là Package backend đã có.

Kế hoạch giao việc chi tiết, chưa triển khai: [03_MVP_IMPLEMENTATION_BACKLOG_v2.6.md](03_MVP_IMPLEMENTATION_BACKLOG_v2.6.md).

## Backlog chặn đóng MVP

1. Logistics FE-05B browser E2E trên DB QA độc lập: Publish → Chat (real persisted) → Claim → Assign → Pickup → GPS → Delivery → Timeline, GPS Mapbox tiles/marker thật khi có token.
2. Chốt giá gói/rate, owner model, chính sách cap, activation/quota & fee snapshot/cancellation/rounding.
3. Implement+test Package/Commission, world oil price feed và Incident Reporting theo spec được phê duyệt.
4. Test đồng thời claim, quota, fee calculation và phân quyền âm tính.
5. Product Owner visual acceptance, regression, docs/code/version đồng bộ, không lỗi P0/P1.

## Được thông báo với đồng đội

> `main` có code logistics và tài liệu hướng dẫn. v2.6 bổ sung đặc tả cho gói hai bên, hoa hồng hai phía, cập nhật giá dầu thế giới và sự cố; các module mới CHƯA được triển khai. Backend đã có báo cáo 71/71 test PASS tại commit trước, không phải bằng chứng full MVP acceptance.
