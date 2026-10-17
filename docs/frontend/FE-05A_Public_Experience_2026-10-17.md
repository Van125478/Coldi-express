# FE-05A — Trang công khai và đăng nhập

Ngày ghi: 17/10/2026. Nhánh `integration/coldi-v2.3-mvp`. Chưa nghiệm thu hình ảnh.

## Vì sao các trang cũ trông như tài liệu

`/giai-phap/chu-hang`, `/giai-phap/nha-xe` và `/ve-chung-toi` là một cột chữ, mỗi ý một thẻ trắng giống nhau. Nội dung là quy tắc nhận chuyến, vai trò và tài chính. Trang chủ điện ảnh thì dùng ảnh hành trình, chữ lớn và khoảng trống. Đăng nhập che ảnh xe bằng lớp navy đậm và kể lại quy trình vận hành.

## Đã đổi

- Giải pháp chủ hàng và nhà xe: ảnh mở đầu lấy từ các khung hình đã dùng trên trang chủ, danh sách lợi ích theo số, ba bước hành trình, nút đăng nhập đúng việc.
- Về COLDI: giới thiệu, vấn đề, cách làm, ba nhóm người dùng, phạm vi pilot Tiền Giang và Long An tới TP. Hồ Chí Minh, Bình Dương, Đồng Nai. Một câu nói phí nền tảng chưa vận hành, không còn khối quy tắc kỹ thuật.
- Đăng nhập: ảnh xe lộ hơn, câu thương hiệu thay cho ba bước vận hành, form trên nền trắng. Logic đăng nhập, lỗi, hiện mật khẩu, phiên đã đăng nhập và đổi mật khẩu lần đầu của tài xế không đổi.

Ảnh dùng: `keyframe-01-open-reefer.jpg`, `keyframe-02-doors-closing.jpg`, `keyframe-03-closed-rear.jpg`, `keyframe-04-high-angle-road.jpg`, `keyframe-rise-midpoint.jpg`.

## Cố ý không nói

Không có ghép xe tự động, ETA, xe gần, thanh toán, huy hiệu xác thực, số liệu vận hành, lịch sử thành lập, khách hàng hay đối tác. Đăng ký công khai vẫn chưa mở. Khách không xem sàn nhà xe. Header khách không đổi hành vi: chưa đăng nhập thì vào đăng nhập, đã đăng nhập thì về đúng khu làm việc.

## Còn lại

Trang chủ điện ảnh không được dựng lại trong lượt này. Header vẫn có cả chữ Đăng nhập và nút tài khoản khi chưa đăng nhập. Chưa có ảnh riêng cho từng trang ngoài các khung hình hành trình hiện có. Người dùng chưa nghiệm thu hình ảnh.
