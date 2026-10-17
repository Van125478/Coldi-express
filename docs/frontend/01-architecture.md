# Kiến trúc frontend COLDI

Tài liệu này mô tả nền tảng frontend sau FE-01. FE-01 không thêm nghiệp vụ mới và không phải bản thiết kế lại giao diện.

Nhánh làm việc: `feature/cinematic-scroll`. Commit đã đẩy: `69ec1a198f0729efc10a3d534dd92d264b1738eb`. Core 09 GPS, Core 10 Chat và Core 11 Đội xe nằm trong cây làm việc, chưa commit.

Dự án mẫu `prjLopADiep` không có trong workspace. Cấu trúc thư mục lấy theo mô tả đã được duyệt, rồi chỉnh cho đúng feature đang có của COLDI. Không sao chép nghiệp vụ hay đăng nhập của dự án mẫu.

## Công nghệ đang chạy

Các phiên bản dưới đây là bản đã cài trong `web/node_modules` tại thời điểm FE-01, không chỉ là khoảng phiên bản trong `package.json`.

| Thành phần | Bản đang dùng |
| --- | --- |
| React / React DOM | 19.3.0 |
| TypeScript | 6.0.3 |
| Vite | 8.3.4 |
| Tailwind CSS và `@tailwindcss/vite` | 4.3.3 |
| React Router | 6.30.6 |
| oxlint | 1.88.0 |
| Radix | `@radix-ui/react-slot` 1.5.0, `@radix-ui/react-label` 2.1.17 |
| class-variance-authority, clsx, tailwind-merge | có |
| lucide-react | có |
| Be Vietnam Pro | `@fontsource/be-vietnam-pro` |

Không có TanStack Query, Zustand, React Hook Form, Zod hay Axios. FE-01 không thêm các thư viện đó.

Xác thực vẫn là cookie `HttpOnly` `coldi_session`. Frontend không lưu JWT trong `localStorage`. Client gọi API bằng `fetch` và `credentials: "include"`.

## Tailwind CSS v4

File Vite được nạp là `web/vite.config.js`. Vite tìm `vite.config.js` trước `vite.config.ts`. Hai file hiện giống nhau: host `127.0.0.1`, cổng `5173`, `strictPort`, alias `@` trỏ vào `web/src`, và plugin `@tailwindcss/vite`. Sửa một file thì phải sửa file còn lại. Không đổi host hoặc cổng.

CSS vào ứng dụng từ `web/src/main.tsx`, file `web/src/styles/global.css`, dòng `@import "tailwindcss"`. Không có `tailwind.config.js`. Token nằm trong khối `@theme` của Tailwind v4.

`web/components.json` trỏ `tailwind.css` tới `src/styles/global.css` và bật `cssVariables`.

## shadcn/ui

Nền shadcn đang dùng style `new-york`, không phải RSC. Component nguồn nằm ở `web/src/shared/components/ui`. Alias trong `components.json`:

- `ui` → `@/shared/components/ui`
- `utils` → `@/lib/utils`

Đã có và đang được màn hình thật dùng:

- `Button`, `Input`, `Label` — form đăng nhập, đăng đơn, nhận chuyến, phân công, đội xe
- `Badge` — nhãn trạng thái workspace qua `StatusBadge`
- `Card` — ô số liệu workspace qua `MetricGrid`

Chưa thêm Dialog, Select, Tabs, Table, Alert. Chưa có màn hình nào được thay bằng các component đó trong FE-01. Không cài thêm gói Radix khi chưa có chỗ dùng.

`web/src/components/ui/button.tsx`, `input.tsx` và `label.tsx` chỉ re-export từ `shared/components/ui` để import cũ tiếp tục chạy. Logo, Icon và cờ Việt Nam vẫn ở `components/ui` vì đó là thành phần thương hiệu, không phải primitive shadcn.

## Token màu

Nguồn màu là `@theme` trong `global.css`. Không nhân bản bảng màu trong TypeScript.

| Việc dùng | Token cũ, vẫn giữ | Token shadcn mới | Mã màu |
| --- | --- | --- | --- |
| Nền trang | `canvas` | `background`, `secondary` | `#F8FAFC` |
| Chữ | `ink` | `foreground`, `card-foreground`, `secondary-foreground`, `popover-foreground` | `#1E293B` |
| Navy | `navy` | `primary`, `ring` | `#1E3A8A` |
| Navy đậm | `navy-deep` | `primary-deep` | `#172554` |
| Chữ trên nút chính | — | `primary-foreground` | `#FFFFFF` |
| Mặt thẻ | `surface` | `card`, `popover` | `#FFFFFF` |
| Viền | `line` | `border`, `input` | `#E2E8F0` |
| Thành công | `success` | — | `#047857` |
| Cảnh báo | `warning` | — | `#B45309` |
| Lỗi | `danger` | `destructive` | `#DC2626` |
| Chữ phụ | `muted` | — | `#475569` |
| Accent liên kết | `accent` | — | `#2563EB` |

`muted` của COLDI là màu chữ phụ. Không gán tên này thành nền xám của shadcn, vì `text-muted` đang dùng khắp workspace.

Nút chính dùng `bg-primary`. Các màn hình còn lại vẫn dùng `bg-navy`, `text-ink`, `border-line`. Hai nhóm trỏ cùng mã màu.

Font sans là Be Vietnam Pro.

## Thư mục và quyền sở hữu

```text
web/src/
  app/                router, paths, RoleGate, providers
  app/guards/         chặn đúng vai trò
  app/providers/      AuthProvider bọc toàn ứng dụng
  features/auth/      phiên đăng nhập
  features/guest/     trang công khai và cinematic
  features/shipments/ nhận chuyến và phân công
  features/workspace/ khu làm việc theo vai trò
  features/workspace/gps/     Core 09, giữ nguyên chỗ
  features/workspace/chat/    Core 10, giữ nguyên chỗ
  features/workspace/carrier/fleet/  Core 11, giữ nguyên chỗ
  shared/components/ui/       primitive shadcn
  shared/components/common/   khối workspace dùng chung
  components/         layout, guest, thương hiệu; một phần là cầu re-export
  services/           gọi API theo nghiệp vụ
  lib/api/client.ts   re-export của services/apiClient.ts
  models/             kiểu dùng chung với API
  styles/global.css   Tailwind và CSS cinematic còn lại
```

Không tạo thư mục rỗng cho `stores/`, `features/fleet` hay `features/gps`. Chưa có client store riêng. GPS, chat và đội xe vẫn nằm trong `features/workspace` vì đang gắn với trang chuyến và router hiện tại.

Quy ước:

- Component chỉ một vai trò ở trong feature của vai trò đó.
- Khối dùng từ hai vai trò trở lên, như tiêu đề trang và nhãn trạng thái, ở `shared/components/common`.
- Primitive nút, ô nhập, nhãn, nhãn trạng thái và thẻ ở `shared/components/ui`.
- Gọi API ở `services/`, không nhét URL vào component trình bày.
- Một kiểu đơn hàng chỉ có một nguồn: `web/src/models/publishedShipment.ts`.
- URL công khai giữ nguyên. Không đổi `/carrier/doi-xe` hay các route GPS, chat, Illustration Lab.

Vị trí dự kiến khi có đợt chuyển riêng, chưa làm trong FE-01:

- `features/workspace/gps` → `features/gps`
- `features/workspace/chat` → `features/chat`
- `features/workspace/carrier/fleet` → `features/fleet`
- `features/shipments` giữ luồng nhận chuyến và phân công cho đến khi tách an toàn
- `components/layout` → `shared/layouts` khi chỉnh layout có kiểm tra giao diện

## API và phiên

`services/apiClient.ts` là implementation duy nhất. `lib/api/client.ts` chỉ re-export `apiRequest` và `ApiError`. Code mới import từ `@/lib/api/client`. Code cũ tiếp tục import `@/services/apiClient`.

`VITE_API_ORIGIN` mặc định `http://127.0.0.1:4000`. Không đổi CORS, Origin hay cookie.

`AppProviders` chỉ bọc `AuthProvider`. Không có context phiên thứ hai. `RoleGate` đọc cùng snapshot đó và chuyển hướng khách chưa đăng nhập. Sai vai trò không thấy nội dung khu làm việc.

## Cách thêm trang

1. Thêm hằng đường dẫn trong `web/src/app/paths.ts` nếu trang có URL ổn định.
2. Đặt page trong feature sở hữu nó, không đặt nghiệp vụ mới vào `pages/` trừ trang công khai đang có.
3. Khai báo route trong `web/src/app/router.tsx`, bọc `RoleGate` nếu cần đăng nhập.
4. Dùng `WorkspaceLayout` hoặc `GuestLayout` sẵn có.
5. Gọi API qua service. Không đổi payload nếu chưa có quyết định nghiệp vụ.

## Cách thêm feature

1. Tạo `web/src/features/<tên>/` khi feature có component, hook hoặc page riêng.
2. Giữ component chỉ feature đó bên trong thư mục feature.
3. Đưa ra `shared/` chỉ khi ít nhất hai feature dùng cùng một khối và khối đó không chứa quy tắc nghiệp vụ riêng.
4. Không tạo store toàn cục chỉ để chứa dữ liệu đã có trong response API.

## Cách thêm component shadcn

1. Chỉ thêm component sắp được một màn hình thật dùng.
2. Đặt file tại `web/src/shared/components/ui`.
3. Dùng token trong `@theme`. Không thêm mã màu rời.
4. Nếu component cần gói Radix mới, cài đúng gói đó.
5. Giữ re-export ở đường dẫn cũ chỉ khi đã có import cũ. Không nhân đôi implementation.

## Phần đã chuyển trong FE-01

- Nguồn `Button`, `Input`, `Label` sang `shared/components/ui`, đường dẫn cũ re-export.
- `PageHeader`, `StatusBadge`, `MetricGrid`, `EmptyPanel`, `DetailBlock`, `FactLine` sang `shared/components/common/panels.tsx`. `features/workspace/ui.tsx` re-export.
- `StatusBadge` dùng `Badge`. `MetricGrid` dùng `Card`. Class và nội dung hiển thị giữ nguyên.
- `RoleGate` sang `app/guards/RoleGate.tsx`, file cũ re-export.
- `main.tsx` dùng `AppProviders`.
- Nút chính, ô nhập và nhãn dùng token semantic tương đương màu cũ.

Chưa chuyển: trang chủ, cinematic, header, footer, form đăng đơn, nhận chuyến, phân công, GPS, chat ngoài một sửa lint nhỏ, đội xe, Illustration Lab, Motion Lab, Transition Lab.

## CSS cũ còn lại

Giữ trong `global.css` vì cinematic và trang khách vẫn cần:

- `@utility hero-dots`, `animate-rise`
- animation `.cold-truck`, `.cold-route`, `.sketch-*`
- `.site-header-cinematic`, `.site-header-menu`
- `.guest-frame`

Trang khách còn một số mã màu viết thẳng trong class, ví dụ dải hero. Chưa đổi trong FE-01.

Workspace dùng utility Tailwind. Không có file CSS riêng cho từng màn hình workspace.

## ChatThread

Cảnh báo oxlint trước FE-01 nằm ở `ChatThread.tsx`: `setMessages([])` gọi đồng bộ trong effect khi `load` hoặc `writable` đổi. Việc xóa đó là cần, vì nếu không xóa thì tin của cuộc trao đổi cũ có thể bị ghép vào cuộc mới.

FE-01 đưa các lệnh `setState` đồng bộ ra khỏi effect. Khi `threadKey` hoặc `writable` đổi, component xóa tin trong lúc render. Effect chỉ đặt lại con trỏ đọc và tiếp tục tải tin. Shipper truyền `threadKey` là id cuộc trao đổi và vẫn remount bằng `key`. Carrier truyền id cuộc trao đổi sau khi mở. Poll 5 giây, tạm dừng khi tab ẩn, và quy tắc nhà xe thua cuộc không đổi.

Effect danh sách cuộc trao đổi của chủ hàng vẫn gọi `setState` sau khi tải. Đó không phải cảnh báo đã được chỉ ra; FE-01 không sửa rộng module chat.

## Lịch sử phân công

Câu chi tiết sự kiện `ASSIGNED` được ghép lúc đọc, từ `vehicle.label` hiện tại, trong `server/src/shipments/shipmentEvents.ts`. Đổi tên hiển thị của xe làm câu trên Timeline đổi theo, dù `shipment.vehicleId` không đổi. Đây là lệch giữa lịch sử đã xảy ra và tên hiện tại. FE-01 không sửa Timeline và không ghi đè sự kiện cũ.

## Việc chưa làm

- Chuyển GPS, chat, đội xe sang thư mục feature riêng.
- Thay form đang chạy bằng Dialog, Select hoặc React Hook Form.
- Bỏ CSS cinematic và các màu viết thẳng trên trang khách.
- Tách bundle lớn.
- Kiểm tra giao diện thủ công toàn bộ vai trò. FE-01 đã mở trang chủ, trang đăng nhập trên desktop và bề rộng 390px, đường dẫn đội xe khi chưa đăng nhập, và Illustration Lab. Chưa đăng nhập để xem workspace.
