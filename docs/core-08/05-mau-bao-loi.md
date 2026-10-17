# Mẫu báo lỗi

Kho mã chưa có mẫu issue trong `.github` và chưa quy định một bảng theo dõi riêng. Chép phần mẫu bên dưới vào tin nhắn cho người điều phối buổi kiểm thử. Không tạo ticket trên một hệ thống chưa được nhóm chọn.

Không gửi mật khẩu, JWT, cookie `coldi_session`, file `.env`, chuỗi `AUTH_SECRET`, hay dữ liệu cá nhân ngoài những gì form nghiệp vụ đã cố ý cho vai trò đó xem.

## Mẫu

```text
Tiêu đề:
Người kiểm thử:
Ngày:
Nhánh và commit:
  Bản team testing dùng main. Chạy git rev-parse HEAD và ghi SHA đó.
  Đừng điền feature/cinematic-scroll hay một SHA cũ.
Môi trường: Windows, Node, MongoDB local hoặc Docker
Trình duyệt:
Vai trò: SHIPPER | CARRIER | DRIVER | ADMIN | khách
Mã ca kiểm thử: ví dụ B-17, kịch bản A, hoặc mô tả ngắn
Điều kiện trước:
Các bước:
Kết quả kỳ vọng:
Kết quả thực tế:
Ảnh màn hình: có hoặc không. Không chụp mật khẩu
Mã đơn, nếu liên quan và không nhạy cảm:
Mức: chặn luồng | sai nhãn | gây khó | ghi chú
Còn sau khi tải lại trang: có | không | chưa thử
```
