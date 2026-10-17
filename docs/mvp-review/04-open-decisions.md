# MVP-01 — Quyết định chủ sản phẩm cần chốt

Chỉ những chỗ tài liệu v2.3 hoặc mã đang để mở. Không đề xuất làm trước khi duyệt.

## 1. Provider bản đồ

Đã chốt cho MVP này: Mapbox GL JS v3. Goong không phải provider của bản đồ. Goong vẫn có thể được xét sau cho geocoding địa chỉ Việt Nam.

Mã dùng Mapbox GL JS 3.33.0, token công khai `pk.` trong `web/.env.local`, và chỉ tạo map khi chủ hàng mở bản đồ. Không có token thì vẫn hiện tọa độ và thời điểm. Tile thật chưa được bấm vì chưa có token hợp lệ trong đợt này. Cách cấu hình, hạn chế URL với `127.0.0.1`, và checklist nghiệm thu nằm ở `09-mapbox-live-map.md`.

Chưa làm: Dynamic ETA, routing, geocoding, và ping gần kho.

## 2. Tọa độ kho và geocode

Nguồn: Master §5.1 có nhịp 1 phút khi gần kho. Mã ghi `warehouseProximity: "unavailable"` vì điểm lấy/giao là chữ.

Tradeoff: geocode tự động dễ gán nhầm kho. Nhập tọa độ tay thì đúng hơn nhưng là việc dữ liệu mới.

Có chặn MVP không: không. Nhịp đứng và nhịp chạy đã có.

Đề xuất: chưa geocode. Chưa bịa tọa độ.

## 3. Tổ chức và thành viên

Nguồn: Master §7.1 bắt `tenant_id`. Decisions không có quy trình tạo doanh nghiệp, một người nhiều công ty, hay active tenant. Core 12 đã ghi BLOCKED trong `docs/core-12/02-tenant-design-and-decisions.md`.

Tradeoff: thêm tenant ngay, không có quy tắc gán dữ liệu cũ, sẽ làm gãy sàn công khai hoặc phải bịa membership. Giữ cách ly theo đơn thì demo chạy, nhưng chưa đạt câu chữ §7.1.

Có chặn MVP demo không: không chặn demo bốn vai trò. Chặn lời tuyên bố “đã multi-tenant”.

Đề xuất: không migration database phát triển. Không thêm `tenant_id` cho đến khi có quy tắc gán tổ chức cho user và đơn đã có.

## 4. Tạo tài khoản tài xế

Nguồn: Decisions mục 3, nhóm Driver. Hồ sơ, bằng lái, xác minh và cách gắn Carrier đều chưa chốt.

Hiện chỉ gán được user DRIVER đã có `carrierId`. Seed demo làm việc đó.

Có chặn MVP không: không chặn demo. Có chặn nhà xe tự thêm tài xế mới.

Đề xuất: đợt đóng này tiếp tục dùng tài khoản được cấp trước. Quy trình mời tài xế là việc riêng sau khi duyệt trường hồ sơ.

## 5. Giữ GPS

Nguồn: Master §5 nói retention chờ quyết định. Mã chỉ giữ một điểm mới nhất.

Tradeoff: lưu lịch sử thì cần thời hạn và quyền xem. Một điểm thì chủ hàng không xem lại đường đã chạy.

Có chặn MVP không: không chặn vị trí hiện tại.

Đề xuất: giữ một điểm đến khi có thời hạn lưu.

## 6. Giữ tin nhắn

Nguồn: Decisions mục Technical, retention chưa chốt. Chat không có hạn xóa.

Có chặn MVP không: không chặn hội thoại đang chạy.

Đề xuất: chưa xóa tin, chưa thêm rate limit bịa. Ghi là giới hạn vận hành.

## 7. Nhà xe thua còn được đọc chat

Nguồn: `server/src/chat/chatAccess.ts` ghi “Provisional”. Test khóa việc nhà xe thua không ghi thêm. Quyền đọc thread đã mở chưa được Decisions đóng.

Có chặn MVP không: không, miễn là không đổi thầm thành “đã duyệt vĩnh viễn”.

Đề xuất: giữ nguyên đến khi chủ sản phẩm chọn một trong hai: nhà xe thua vẫn đọc thread cũ, hoặc mất quyền đọc sau khi thua.

## 8. Bền và hạn của audit

Nguồn: Master §7.2. Mã nuốt lỗi insert. Không có giao dịch chung với ghi đơn. Không có hạn lưu, không có khóa chống sửa.

Có chặn demo không: không. Chặn production.

Đề xuất: với demo, chấp nhận cửa sổ mất log và ghi rõ. Trước production mới xét outbox hoặc báo lỗi audit tách khỏi phản hồi người dùng. Không mở màn đọc audit cho đến khi có danh sách người được xem.

## 9. Xóa hoặc ngừng xe

Không có quyết định trong D-07. D-07 chỉ đề xuất đăng kiểm và bảo dưỡng.

Có chặn MVP không: không. Xe tạo nhầm vẫn còn trong danh sách.

Đề xuất: chưa xóa cứng. Nếu cần, một cờ “ngừng gán” phải được duyệt trước, và xe đã gán trên đơn cũ vẫn hiện trong timeline.

## 10. Lưu chuyến quan tâm

Phụ lục E nói bookmark không được Claim. Không có quyết định lưu theo tài khoản.

Có chặn MVP không: không. So sánh tạm đã có trên trang.

Đề xuất: chưa làm collection bookmark.

## 11. Hủy, gán lại, đóng chuyến

Nguồn: Decisions mục 3, nhóm Nghiệp vụ. COMPLETED, INCIDENT, CANCELLED nằm trong bảng Master §4.2 nhưng chưa có quyền và lý do.

Có chặn chuỗi chính không: không. Chuỗi dừng đúng ở DELIVERY_CONFIRMED.

Đề xuất: chưa thêm nút hủy hay nút hoàn tất.

## 12. Tài chính

Nguồn: D-06 CHỜ DUYỆT; `Coldi_04_Business_Finance_v2.3.docx` §2 ghi KHÔNG được vận hành.

Có chặn MVP vận tải không: không.

Đề xuất: không làm công nợ, hạn mức, escrow, tạm ứng.

## 13. Câu timeline sau khi đổi tên xe

Không nằm trong Decision Register. MVP-03 đã lưu tên xe và tên tài xế trên event lúc gán. Lần gán mới không đổi câu khi sửa đội xe.

Event cũ không có snapshot vẫn đọc tên hiện tại. Không viết lại đơn đã nghiệm thu. Chi tiết ở `08-timeline-history-fix.md`.
