# Quyết định UAT — APPROVED, chưa triển khai

Các mục dưới đây đã được duyệt để làm sau. v2.10 không sửa UI và không code các mục này. Mobile và thiết kế mới không nằm trong đợt này.

## CHAT-01 — APPROVED, NOT IMPLEMENTED

Chủ hàng chủ động mở Chat với nhà xe ngay khi đơn đã được Claim. Không cần đợi nhà xe mở hội thoại trước.

## FORM-01 — APPROVED, NOT IMPLEMENTED

Lỗi validation hiện trực tiếp dưới trường nhập. Trường sai có viền lỗi và được focus. Lỗi biến mất khi giá trị đã hợp lệ.

Áp dụng cho Tạo đơn, Thêm xe và Tạo tài xế.

## IMG-01 — APPROVED phần số lượng, NOT IMPLEMENTED

Mỗi đơn mới bắt buộc tối thiểu 1 ảnh và tối đa 5 ảnh hàng hóa. Upload ở bước 3 của Tạo đơn. Có xem trước, xóa, và nhà xe nhìn thấy ảnh.

Đơn cũ không có ảnh phải vẫn đọc được. Không chặn đơn lịch sử chỉ vì thiếu ảnh.

Định dạng file và dung lượng tối đa là đề xuất kỹ thuật, **chưa APPROVED**. Không lấy một số cụ thể làm luật.

## DRIVER-04 — APPROVED, NOT IMPLEMENTED

Carrier tự tạo username và mật khẩu cho Driver. Form tạo tài xế mới không bắt email.

Driver dùng mật khẩu Carrier đã cấp. Lần đăng nhập đầu không bắt buộc đổi mật khẩu. Driver vẫn tự đổi mật khẩu khi muốn.

Mật khẩu lưu dạng hash. Reset mật khẩu có phân quyền. Tài khoản Driver cũ đang dùng email vẫn đăng nhập được trong thời gian chuyển đổi.

## TEXT-01 — APPROVED, NOT IMPLEMENTED

Timeline không lặp tiền tố. Không còn chữ "Xe Xe..." và "Tài xế Tài xế...".

## UX-04 — chưa duyệt triển khai

Có đề xuất để Dashboard Carrier thêm tổng chuyến đang vận chuyển và tổng chuyến đã giao. Đề xuất này chưa được duyệt để làm. Không coi là backlog đã chốt.
