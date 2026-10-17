# Hướng dẫn demo Coldi Freight

> Bản này mô tả giao diện trước khi có API. Không dùng để cài đặt hoặc demo hiện tại. Hướng dẫn đang dùng là [docs/core-08/README.md](core-08/README.md).

Tài liệu này dành cho lập trình viên, kiểm thử, mentor và người review. Nội dung bám mã nguồn trong `web/` tại thời điểm viết, không suy ra tính năng từ bản vẽ Figma.

Phân loại dùng trong toàn bộ tài liệu:

| Nhãn | Ý nghĩa |
| --- | --- |
| **Đã triển khai** | Có trên website và thao tác được như mô tả. |
| **Chỉ giao diện** | Có màn hình hoặc biểu mẫu, nhưng không gọi máy chủ và không đổi dữ liệu nghiệp vụ. |
| **Dữ liệu minh họa** | Nội dung tĩnh để giải thích bố cục. Không phải đơn, GPS hay số liệu vận hành. |
| **Chưa bắt đầu** | Chưa có route, màn hình hoặc API trong `web/`. |
| **Dự kiến — chưa triển khai** | Luồng đã chốt trong Master Concept, chưa có trong ứng dụng. |

Khi tài khoản demo hoặc API được thêm sau này, phải cập nhật mục C, E, F và G. Không ghi nhận mật khẩu production, API key, token hay secret vào file này.

## A. Tổng quan Coldi

Coldi là nền tảng logistics lạnh B2B. Chủ hàng niêm yết đơn. Nhà xe tự xem sàn và tự bấm nhận chuyến. Sau khi nhận, nhà xe tự gán xe và tài xế. Tài xế được giao xác nhận lấy hàng rồi xác nhận giao hàng. GPS, khi có, chỉ theo dõi vị trí. GPS không xác nhận lấy hàng hay giao hàng.

Không có tự động ghép đơn, tự động điều phối hay tự động gán xe. Phí nền tảng, công nợ, hạn mức, ký quỹ và tạm ứng cước chưa được phê duyệt, nên website không trình bày các hạng mục đó như quy định đang áp dụng.

### Kiến trúc đang chạy

Bản demo hiện tại là **website đáp ứng**, không phải ứng dụng iOS/Android và không có bộ cài Desktop. Một codebase React phục vụ trình duyệt máy tính, máy tính bảng và điện thoại.

```text
C:\Coldi\web\          ứng dụng
C:\Coldi\web\src\     mã nguồn
C:\Coldi\docs\        tài liệu, gồm file này và khóa học React trong docs/tecandlearnfront/
C:\Coldi\Coldi_Documentation_v2.3\   yêu cầu nghiệp vụ đã chốt (docx)
C:\Coldi\Asset\coldi\ ảnh xuất từ thiết kế, không phải màn hình đang chạy
```

`docs/tecandlearnfront/react/` là tài liệu khóa học React. Đó không phải backend của Coldi và không phải hợp đồng API đã duyệt.

### Stack đã cài trong `web/package.json`

| Thành phần | Phiên bản khai báo |
| --- | --- |
| React / React DOM | ^19.2.8 |
| TypeScript | ~6.0.2 |
| Vite | ^8.3.0 |
| React Router DOM | ^6.30.6 |
| Tailwind CSS | ^4.3.3, qua `@tailwindcss/vite` |
| Thành phần form kiểu shadcn | `@radix-ui/react-slot`, `@radix-ui/react-label`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Icon | `lucide-react` |
| Font | `@fontsource/be-vietnam-pro` |
| Chuyển động cuộn | `gsap` ^3.15.0 |
| Cảnh 3D | `three` ^0.186.1, `@react-three/fiber` ^9.8.1, `@react-three/drei` ^10.7.9 |
| Lint | `oxlint` ^1.81.0 |

Không có backend, cơ sở dữ liệu, SDK bản đồ hay thư viện xác thực trong `package.json`.

### Khách và bốn vai trò nghiệp vụ

Guest **không phải vai trò thứ năm**. Guest là người chưa đăng nhập.

| Đối tượng | Trong sản phẩm đã chốt | Trong website hiện tại |
| --- | --- | --- |
| Guest | Xem thông tin công khai. Không đăng đơn, không nhận chuyến, không xem dữ liệu riêng. | Mọi lượt mở trang đều là Guest, vì `readSession()` luôn trả về anonymous. |
| Chủ hàng (SHIPPER) | Tạo và niêm yết đơn. | Chưa có phiên đăng nhập, chưa có màn tạo đơn. |
| Nhà xe (CARRIER) | Xem sàn, tự nhận chuyến, tự gán xe và tài xế. | Chưa có phiên đăng nhập, chưa có sàn đơn thật. |
| Tài xế (DRIVER) | Chỉ xử lý chuyến được giao. Không tự mở sàn và không tự nhận chuyến. | Chưa có màn tài xế. |
| Quản trị (ADMIN) | Vận hành nội bộ Coldi. | Chưa có màn quản trị. |

Kiểu phiên nằm ở `web/src/models/session.ts`. Nhánh `authenticated` mới chỉ là kiểu TypeScript. `web/src/services/sessionService.ts` không đọc `localStorage` và không phát hành token.

## B. Hướng dẫn cài đặt và chạy demo

Làm việc trong thư mục `web/`. Lệnh bên dưới lấy từ `scripts` của `web/package.json`.

### Điều kiện

| Hạng mục | Yêu cầu |
| --- | --- |
| Node.js | `^20.19.0` hoặc `>=22.12.0`, theo `engines` của Vite 8 đang được cài |
| Trình quản lý gói | npm. Repo ứng dụng không khai báo `packageManager` riêng. Không trộn `pnpm install` vào cây `node_modules` đã cài bằng npm. |
| Trình duyệt | Bản mới có WebGL nếu muốn xem cảnh 3D. Không có WebGL vẫn xem được nội dung tĩnh. |
| Backend | Không cần. Chưa có máy chủ để nối. |

### Cài dependency

```bash
cd web
npm install
```

### Chạy máy chủ phát triển

```bash
cd web
npm run dev
```

Vite lắng nghe cổng **5173** (`web/vite.config.ts`). Mở:

```text
http://localhost:5173/
```

Nếu cần gắn địa chỉ loopback:

```bash
cd web
npm run dev -- --host 127.0.0.1 --port 5173
```

URL tương ứng: `http://127.0.0.1:5173/`.

### Build, xem bản build, lint

```bash
cd web
npm run lint
npm run build
npm run preview
```

| Lệnh | Việc làm |
| --- | --- |
| `npm run lint` | Chạy oxlint. |
| `npm run build` | `tsc -b` rồi `vite build`. Kết quả nằm ở `web/dist/`. |
| `npm run preview` | Phục vụ thư mục `dist` sau khi build. |

Không có script test đơn vị trong `package.json`.

### Lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| `npm run dev` báo không thấy script | Đang đứng ngoài `web/`. `cd web` rồi chạy lại. |
| Vite báo Node không đủ mới | Cài Node 20.19 trở lên, hoặc Node 22.12 trở lên. |
| Cổng 5173 đã được dùng | Tắt tiến trình cũ hoặc chạy `npm run dev -- --port 5174` và mở đúng cổng đó. |
| Trang chủ tối, không thấy khối 3D | Máy bật `prefers-reduced-motion`, hoặc trình duyệt không có WebGL. Khi đó trang dùng khung tĩnh trong `StaticJourney`, vẫn có chữ và nút. |
| Bấm Đăng nhập mà vẫn ở trang đăng nhập | Đúng hành vi hiện tại. Biểu mẫu không tạo phiên. |
| `npm audit` báo lỗ hổng vừa | Không chạy `npm audit fix --force` chỉ để dọn demo. Lệnh đó có thể nâng phá vỡ dependency. |
| Tìm API Coldi trong `docs/tecandlearnfront` | Thư mục đó là giáo trình React, không phải dịch vụ Coldi. |

## C. Danh sách tài khoản demo

Đã rà `web/src`: không có danh sách user, không có mật khẩu, không có seed, không có nhánh đăng nhập thành công.

| Vai trò | Email / tên đăng nhập | Mật khẩu | Quyền truy cập | Trạng thái |
| --- | --- | --- | --- | --- |
| Chủ hàng | Chưa có | Chưa có | Chưa vào được khu đăng đơn | **Chưa triển khai** |
| Nhà xe | Chưa có | Chưa có | Chưa vào được sàn nhận chuyến | **Chưa triển khai** |
| Tài xế | Chưa có | Chưa có | Chưa có màn chuyến được giao | **Chưa triển khai** |
| Quản trị | Chưa có | Chưa có | Chưa có màn quản trị | **Chưa triển khai** |

Không điền email giả để “thử cho có”. Ô bất kỳ trên `/dang-nhap` đều không đăng nhập được. Khi sau này có tài khoản chỉ dùng cho máy dev, cập nhật bảng này và ghi rõ giới hạn của từng tài khoản.

## D. Hướng dẫn demo Guest

Mọi route công khai đều nằm sau `GuestLayout`: đầu trang, `#noi-dung`, chân trang. Route xác thực dùng `AuthLayout`.

### Route đang có

| Đường dẫn | Việc người xem thấy | Mã nguồn |
| --- | --- | --- |
| `/` | Trang khách điện ảnh: cảnh 3D theo cuộn, rồi khối năng lực | `web/src/pages/LandingPage.tsx` |
| `/phien-ban-cu` | Trang khách cũ: hero thẻ minh họa, vòng SVG, dải số liệu thiết kế | `web/src/pages/LegacyLandingPage.tsx` |
| `/tim-chuyen-hang` | Một thẻ minh họa, không phải sàn đơn | `web/src/pages/FindShipmentsPage.tsx` |
| `/dang-don` | Khách bị chuyển sang đăng nhập | `web/src/app/RequireAuth.tsx` |
| `/ve-chung-toi` | Tóm tắt nghiệp vụ đã chốt | `web/src/pages/AboutPage.tsx` |
| `/giai-phap/chu-hang` | Mô tả chủ hàng và giới hạn hiện tại | `web/src/pages/SolutionPage.tsx` |
| `/giai-phap/nha-xe` | Mô tả nhà xe và giới hạn hiện tại | cùng file |
| `/nen-tang` | Giải thích đây là website, chưa có file cài đặt | `web/src/pages/PlatformPage.tsx` |
| `/dang-nhap` | Biểu mẫu đăng nhập, không gửi yêu cầu xác thực | `web/src/pages/LoginPage.tsx` |
| `/dang-ky` | Biểu mẫu đăng ký, không tạo tài khoản | `web/src/pages/RegisterPage.tsx` |
| Đường dẫn khác, ví dụ `/khong-co` | Trang 404 | `web/src/pages/NotFoundPage.tsx` |

Menu đầu trang, từ `web/src/components/layout/SiteHeader.tsx`: Trang chủ, Tìm chuyến hàng, Đăng đơn hàng, Giải pháp đối tác, Về chúng tôi, ngôn ngữ, Đăng nhập, Đăng ký, tài khoản. Menu đối tác có “Dành cho chủ hàng” và “Dành cho nhà xe”. Tiếng Anh chưa có bản dịch; menu ngôn ngữ nói rõ điều đó.

### Các bước demo

1. Mở `http://localhost:5173/`.
2. Kiểm tra thương hiệu COLDI trên đầu trang. Trang chủ dùng thanh điều hướng tối, chữ trắng. Các trang khác dùng thanh sáng.
3. Ở hero, đọc tiêu đề **“Kết nối vận tải lạnh, minh bạch từng hành trình.”** Hai nút:
   - **Tìm chuyến ngay** tới `/tim-chuyen-hang`.
   - **Đăng đơn hàng** tới `/dang-nhap?action=publish&next=%2Fdang-don`.
4. Cuộn chậm trong khối ghim. Cảnh WebGL đổi theo vị trí cuộn, lần lượt:
   - 01 Coldi Freight
   - 02 Kho lạnh
   - 03 Xe lạnh trên đường bộ
   - 04 Tuyến pilot: Tiền Giang, Long An, TP. Hồ Chí Minh, Bình Dương, Đồng Nai
   - 05 Kho nhận
   Đây là hình dựng thủ tục bằng Three.js, không phải mô hình 3D mua sẵn và không phải GPS. Nếu máy giảm chuyển động hoặc không có WebGL, năm ý này hiện thành danh sách tĩnh.
5. Cuộn tiếp tới **“Minh bạch trên đơn, không tự điều xe.”** Ba cột Chủ hàng, Nhà xe tự nhận, Nhìn thấy chuyến, rồi khối kêu gọi hành động. Không có số liệu vận hành trên trang này.
6. Bấm **Tìm chuyến ngay**. Trang nói rõ sàn thật chưa nối. Thẻ `CD-8924`, TP. Hồ Chí Minh đi Đà Nẵng, hàng điện tử, là **dữ liệu minh họa từ bản thiết kế**, không phải đơn lạnh đang mở. Nút **Nhận chuyến với tài khoản Nhà xe** tới `/dang-nhap?action=claim&next=%2Ftim-chuyen-hang`.
7. Bấm **Đăng đơn hàng**. Vì phiên luôn là khách, `/dang-don` đổi hướng sang đăng nhập với `action=publish`. Trang đăng nhập giải thích biểu mẫu không tạo đơn.
8. Trên `/dang-nhap`, điền email và mật khẩu bất kỳ rồi bấm **Đăng nhập**. Mật khẩu bị xóa. Dòng trạng thái: không có yêu cầu đăng nhập nào được gửi. **Quên mật khẩu?** chỉ hiện “Khôi phục mật khẩu chưa được triển khai.” Không có ô ghi nhớ đăng nhập.
9. Mở `/dang-ky`, gửi biểu mẫu. Kết quả cùng kiểu: không lưu, không cấp vai trò.
10. Mở `/ve-chung-toi` để nói phạm vi pilot, cách nhận chuyến thủ công, và việc GPS không chốt lấy/giao.
11. Nếu cần đối chiếu bản cũ, mở `/phien-ban-cu`. Trang đó vẫn còn vòng SVG 16 giây và dải số 12.500+, 3.200+, 100%, 15–30 phút, 4.9/5. Các số này lấy từ bản thiết kế và **chưa phải số liệu vận hành**. Trang chủ mới không dùng dải số đó.

### Giới hạn của Guest

Khách xem được các route ở bảng trên. Khách không đăng đơn, không nhận chuyến, không gán xe, không mở hồ sơ doanh nghiệp, chứng từ, chat hay GPS của một chuyến thật. Chân trang cũng ghi điều này.

## E. Demo cho từng vai trò

Không có route `/chu-hang`, `/nha-xe`, `/tai-xe`, `/quan-tri`. Ảnh trong `Asset/coldi/` là thiết kế, không phải màn hình đã nối vào router.

### SHIPPER

**Đã có hôm nay**

| Hạng mục | Thực tế |
| --- | --- |
| Lối vào | `/giai-phap/chu-hang`, hoặc Đăng đơn hàng |
| Trang | Văn bản mô tả việc đăng đơn. Nút dẫn tới đăng nhập. |
| Kết quả | Không tạo được đơn. `/dang-don` không bao giờ hiện form tạo đơn với khách ẩn danh. |

**Dự kiến — chưa triển khai**

1. Chủ hàng đăng nhập.
2. Tạo đơn: hàng hóa, điểm lấy, điểm giao, nhóm nhiệt độ, yêu cầu xe, giá niêm yết.
3. Đơn lên sàn với nhãn **Đang tìm xe** (trạng thái nghiệp vụ PUBLISHED).
4. Sau khi một nhà xe nhận được, chủ hàng thấy **Đã có xe nhận chuyến**.
5. Trao đổi theo đơn không giữ chỗ.
6. Khi đã có quyền trên chuyến, xem mốc và vị trí GPS.

Nhóm nhiệt độ đã chốt là Lạnh mát, Đông, Cực lạnh. Chưa chốt ngưỡng °C mặc định.

### CARRIER

**Đã có hôm nay**

| Hạng mục | Thực tế |
| --- | --- |
| Lối vào | `/giai-phap/nha-xe` và `/tim-chuyen-hang` |
| Trang | Mô tả quyền nhà xe, cộng một thẻ minh họa. |
| Kết quả | Nút nhận chuyến chỉ mở đăng nhập. Không khóa đơn, không gán xe, không gán tài xế. |

**Dự kiến — chưa triển khai**

1. Nhà xe đăng nhập và mở sàn các đơn đang tìm xe.
2. Nhà xe tự bấm nhận. Máy chủ khóa đơn để chỉ một nhà xe thành công. Gọi điện hoặc chat không giữ chỗ.
3. Nhà xe tự gán xe và tài xế.
4. Sau khi gán, chuyến ở trạng thái chờ lấy hàng.
5. Tài xế trực thuộc không tự nhận chuyến thay nhà xe.

### DRIVER

**Đã có hôm nay:** chưa có route, menu hay biểu mẫu tài xế.

**Dự kiến — chưa triển khai**

1. Tài xế đăng nhập và chỉ thấy chuyến được giao.
2. Tài xế xác nhận lấy hàng. Trước mốc đó chuyến chưa sang đang vận chuyển.
3. Trong lúc chạy, GPS theo dõi vị trí và không tự chốt lấy hay giao.
4. Tài xế xác nhận giao hàng thì chuyến hoàn thành.

### ADMIN

**Đã có hôm nay:** chưa có route quản trị.

**Dự kiến — chưa triển khai:** khu vận hành nội bộ Coldi. Phạm vi màn hình quản trị chưa được dựng trong `web/`, nên demo không đi sâu hơn câu này.

## F. Kịch bản demo đầu cuối

Luồng nghiệp vụ đã chốt:

```text
Chủ hàng đăng đơn
→ Nhà xe tìm thấy đơn
→ Nhà xe tự bấm nhận
→ Nhà xe gán xe và tài xế
→ Tài xế xác nhận lấy hàng
→ Chuyến sang đang vận chuyển
→ Chủ hàng / nhà xe theo dõi GPS
→ Tài xế xác nhận giao hàng
→ Chuyến hoàn thành
```

| Bước | Trạng thái trong website này |
| --- | --- |
| Chủ hàng đăng đơn | **Chưa bắt đầu.** Nút chỉ mở trang đăng nhập. |
| Nhà xe tìm đơn trên sàn | **Chưa bắt đầu.** `/tim-chuyen-hang` chỉ có thẻ minh họa điện tử HCM → Đà Nẵng. |
| Nhà xe tự nhận | **Chưa bắt đầu.** Không có API khóa đơn. |
| Gán xe và tài xế | **Chưa bắt đầu.** |
| Tài xế xác nhận lấy hàng | **Chưa bắt đầu.** |
| Chuyến sang đang vận chuyển | **Chưa bắt đầu.** |
| Theo dõi GPS | **Chưa bắt đầu.** Cảnh tuyến trên trang chủ là hình minh họa. |
| Tài xế xác nhận giao | **Chưa bắt đầu.** |
| Hoàn thành chuyến | **Chưa bắt đầu.** |

Không trình bày luồng này như một bài demo bấm được từ đầu tới cuối.

Nhãn trạng thái sẽ dùng khi luồng được dựng, lấy từ tài liệu đã chốt:

| Mốc | Nhãn giao diện |
| --- | --- |
| Đơn vừa niêm yết | Đang tìm xe |
| Đã có nhà xe nhận | Đã có xe nhận chuyến |
| Đã gán xe và tài xế, chưa lấy | Chờ lấy hàng |
| Sau khi tài xế xác nhận lấy | Đang vận chuyển |

## G. Trạng thái triển khai

Mỗi hàng chỉ có một cột trạng thái được đánh **Có**.

| Tính năng | Đã triển khai | Chỉ giao diện | Dữ liệu minh họa | Chưa bắt đầu | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| Trang khách `/` | Có | | | | Cảnh cuộn 3D và khối năng lực. Thanh điều hướng, nút, route còn hoạt động. |
| Hoạt họa khách | Có | | | | WebGL + GSAP ScrollTrigger trên `/`. Bản SVG cũ nằm ở `/phien-ban-cu`. |
| Đăng nhập | | Có | | | `/dang-nhap` không tạo phiên. |
| Đăng ký | | Có | | | `/dang-ky` không tạo tài khoản và không gán vai trò. |
| Định tuyến theo vai trò | | | | Có | Mọi phiên đều anonymous. Chưa có layout Chủ hàng, Nhà xe, Tài xế, Quản trị. |
| Chủ hàng tạo đơn | | | | Có | `/dang-don` chuyển về đăng nhập. |
| Nhà xe nhận chuyến | | | | Có | Nút chỉ mở `/dang-nhap?action=claim`. |
| Gán xe / tài xế | | | | Có | Không có màn hình. |
| Tài xế xác nhận lấy hàng | | | | Có | Không có màn hình. |
| GPS | | | | Có | Chỉ có hình tuyến pilot trên trang chủ, có chú thích không phải tín hiệu thật. |
| Tài xế xác nhận giao hàng | | | | Có | Không có màn hình. |
| Chat | | | | Có | Không có màn hình. |
| Tài chính | | | | Có | Ảnh Figma trong `Asset/coldi/` có SOA, hạn mức, gói dịch vụ. Các hạng mục này chưa được phê duyệt và không có trong app. |
| Quản trị | | | | Có | Không có route. |
| Thẻ chuyến CD-8924 | | | Có | | Hàng điện tử, HCM → Đà Nẵng. Dùng trên `/tim-chuyen-hang` và `/phien-ban-cu`. |

## H. Hướng dẫn kiểm thử demo

Chạy `npm run dev` trong `web/` trước khi kiểm.

### Bố cục

| Việc | Kỳ vọng |
| --- | --- |
| Desktop rộng, khoảng 1440px | Menu ngang từ mốc 1200px. Hero có tiêu đề lớn và hai nút. Cuộn đổi cảnh, không tràn ngang. |
| Máy tính bảng, khoảng 768px | Menu hamburger. Cảnh 3D dùng chất lượng nhẹ hơn dưới 1024px và quãng cuộn ngắn hơn. |
| Điện thoại, khoảng 390px | Không tràn ngang. Nút Tìm chuyến và Đăng đơn vẫn bấm được. Menu đóng sau khi chọn trang. |
| `/dang-nhap` dưới 1024px | Cột hình bên trái ẩn. Biểu mẫu chiếm trang. |
| `/dang-nhap` từ 1024px | Cột thương hiệu bên trái, form bên phải. Hình xe không điều khiển form. |

### Điều hướng

- Trang chủ, Tìm chuyến hàng, Về chúng tôi, hai giải pháp đối tác, Đăng nhập, Đăng ký đều mở đúng route ở mục D.
- Đăng đơn hàng và nút tài khoản đều rơi vào đăng nhập, không vào khu riêng.
- `/giai-phap/khac` hiện “Không có giải pháp này”.
- Một path không có, ví dụ `/abc`, hiện 404 và có đường về trang chủ.

### Chuyển động

- Khi hệ thống cho phép chuyển động, cuộn trong khối đầu trang đổi chương 01 đến 05 và thanh tiến độ.
- Bật `prefers-reduced-motion: reduce`: không phụ thuộc GSAP; hiện đủ năm ý và khung tĩnh.
- Tắt WebGL, hoặc trình duyệt không tạo được ngữ cảnh WebGL: cùng lối tĩnh, có câu nói trình duyệt không dựng được cảnh ba chiều.
- Không có âm thanh tự phát.

### Đăng nhập và route chặn

- Gửi form đăng nhập: ở lại trang, mật khẩu trống, có thông báo không gửi yêu cầu.
- Gửi form đăng ký: không xuất hiện vai trò mới trên menu.
- Mở thẳng `/dang-don`: URL thành `/dang-nhap?action=publish&next=%2Fdang-don`.
- Từ tìm chuyến, bấm nhận chuyến: URL có `action=claim` và `next=%2Ftim-chuyen-hang`.

### Trạng thái tải và lỗi

- Cảnh 3D được `lazy()` trong `SceneCanvas`. Trong lúc chunk tải, nền khối ghim vẫn tối và chữ hero vẫn đọc được.
- Không có màn lỗi API vì không có cuộc gọi API.
- Trang giải pháp sai audience và trang 404 là hai trạng thái “không có nội dung” đã có.

### Lệnh kiểm tra mã

```bash
cd web
npm run lint
npm run build
```

Cả hai lệnh cần kết thúc với mã thoát 0 trước khi mang bản build đi demo. `npm run build` tạo thêm chunk Three.js khá lớn. Đó là cảnh trang chủ, được tách khỏi bundle chính, không phải lỗi biên dịch.

## I. Giới hạn đã biết

- Chưa có backend, cơ sở dữ liệu, hợp đồng API, nhà cung cấp bản đồ, hay giao thức đăng nhập. Technical Handoff vẫn để các mục này ở trạng thái chờ.
- Xác thực chưa triển khai. Không có tài khoản demo. Không được diễn giải một lần bấm Đăng nhập là đã vào vai trò.
- Thẻ CD-8924 và, trên `/phien-ban-cu`, các chỉ số 12.500+, 3.200+, 100%, 15–30 phút, 4.9/5 là nội dung thiết kế. Trang chủ mới không lặp lại dải chỉ số đó.
- Cảnh 3D dựng bằng hình học thủ tục trong `web/src/features/guest/cinematic/`. Không tải mô hình glTF. Chất lượng là minh họa thương hiệu, không phải ảnh hiện trường.
- Ảnh `Asset/coldi/` và `image.png` ở thư mục gốc là tham chiếu thiết kế. Phần lớn màn chủ hàng, nhà xe, tài xế, POD, SOA chưa được code.
- Giả định chưa được phê duyệt, không demo như chính sách: Net 30, hạn mức tín dụng, ký quỹ, phí nền tảng, tạm ứng cước, tự động điều xe.
- Tiếng Anh chưa dịch.
- Chưa có bộ cài Windows, macOS, Android, iOS dù một số bản thiết kế có hàng “tải ứng dụng”. Trang `/nen-tang` nói rõ điều này. Trang cũ `/phien-ban-cu` vẫn có hàng nền tảng từ thiết kế; khi demo trang đó phải nói đây không phải link tải thật.
- Chưa có chat, chứng từ, đánh giá, hay theo dõi GPS sống.
- `npm audit` có thể báo lỗ hổng ở dependency. Không xử lý bằng `--force` trong lúc demo.

## J. Kịch bản trình bày 5–7 phút

Đọc theo những gì bấm được hôm nay. Câu trong ngoặc kép là lời nói gợi ý.

### 1. Mở đầu, khoảng 45 giây

“Coldi Freight là website B2B cho vận tải lạnh đường bộ. Chủ hàng đưa đơn lên sàn. Nhà xe tự nhận, rồi tự giao xe và tài xế. Tài xế xác nhận lấy và giao. GPS chỉ để nhìn vị trí, không thay người xác nhận.”

### 2. Bài toán, khoảng 40 giây

“Phần việc đã chốt là kết nối trực tiếp, có người bấm nhận, và máy chủ sau này phải khóa đơn để chỉ một nhà xe thành công. Bản demo hôm nay cho xem website khách và các đường dẫn. Phần nhận đơn thật chưa nối máy chủ.”

### 3. Website khách, khoảng 90 giây

Mở `/`. Chỉ thanh COLDI, tiêu đề, hai nút.

“Tìm chuyến đi tới trang công khai. Đăng đơn không mở form, vì khách chưa có quyền.”

Cuộn qua kho lạnh, xe lạnh, tuyến Tiền Giang và Long An tới TP. Hồ Chí Minh, Bình Dương, Đồng Nai, rồi kho nhận.

“Đây là một cảnh dựng để kể hành trình. Không phải xe đang chạy và không phải tín hiệu GPS.”

Dừng ở khối “Minh bạch trên đơn, không tự điều xe.” Đọc một câu: không tự ghép, không tự điều, không tự gán.

### 4. Tương tác đang có, khoảng 90 giây

Mở Tìm chuyến. Chỉ vào thẻ CD-8924.

“Thẻ này lấy từ bản thiết kế, hàng điện tử đi Đà Nẵng, để khỏi hiểu nhầm thành đơn lạnh thật.”

Bấm nhận chuyến, chỉ URL `action=claim`. Quay lại, bấm Đăng đơn, chỉ URL `action=publish`. Gửi form với email bất kỳ.

“Mật khẩu bị xóa và trang nói không có yêu cầu nào được gửi. Chưa có tài khoản demo.”

Mở Về chúng tôi, chỉ đoạn pilot và đoạn lấy hàng / giao hàng.

### 5. Tiến độ và việc tiếp theo, khoảng 60 giây

“Đã có website khách, điều hướng, trang giải thích hai vai trò, form đăng nhập và đăng ký ở mức giao diện, cùng cảnh cuộn. Chưa có phiên đăng nhập, sàn đơn, nhận chuyến, gán xe, màn tài xế, GPS thật, chat, tài chính hay quản trị.”

“Việc kế tiếp, sau khi chốt giao thức xác thực và API, là tài khoản dev cho bốn vai trò, rồi lần lượt đăng đơn, nhận chuyến có khóa trên máy chủ, gán xe và tài xế, xác nhận lấy, theo dõi vị trí, xác nhận giao.”

Tổng thời lượng khoảng 6 phút nếu không đào sâu trang cũ. Chỉ mở `/phien-ban-cu` khi người xem hỏi bản thiết kế trước đó, và nói rõ các con số trên trang đó chưa được kiểm chứng.
