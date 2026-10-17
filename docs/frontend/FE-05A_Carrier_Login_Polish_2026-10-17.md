# FE-05A — Carrier polish and login balance

Date: 17/10/2026. Branch `integration/coldi-v2.3-mvp`. Visual acceptance is still pending.

## Carrier

- Sidebar logo no longer sits in a white rounded box. The original blue mark (`Asset/logo coldi 5.png`, transparent background) is recolored white only on the navy sidebar and on the dark login panel. Guest and light workspace logos stay the blue mark.
- Carrier Home accepted shipments are cards: route, status, cargo, temperature, vehicle requirement, pickup date, price, and Phân công or Xem. The real marketplace stays at `/carrier/tim-chuyen`. Home shows at most six accepted cards and links to Chuyến của tôi.
- Marketplace card component was not replaced. The local board had zero published shipments, so live cards were not re-shot. The empty state is separate from loading and error.
- Add Vehicle is a centered two-column form. Fields and payload are unchanged.
- Fleet cards separate the vehicle name and plate from type, temperature, and capacity. Missing values read “Chưa ghi”.
- Chuyến của tôi no longer explains the MATCHED state in the introduction. Groups stay Chờ phân công, Đã phân công chờ lấy hàng, Đang vận chuyển, and Đã giao.
- Driver management was left as-is. Its form already uses the content width.

## Login and public copy

Login keeps the road image and the two-column layout. The form is wider, the image crop shows the truck, and the supporting line is “Đăng nhập để tiếp tục quản lý công việc và các chuyến hàng trên COLDI.”

Copy only:

- Shipper benefit: “Theo dõi tiến độ vận chuyển”, with the existing GPS qualification.
- Carrier benefit: “Đăng nhập để khám phá các chuyến hàng đang được niêm yết.”
- Fleet heading: “Quản lý đội xe và tài xế”.
- About close: “Khám phá COLDI dành cho bạn”. The fee line stays, in smaller type.

## Not verified

No live marketplace cards. No vehicle was created, no driver was created, and no assignment was submitted. Login success was used only to open the carrier workspace. No business record was written by this pass.

## Final visual pass, same day

The earlier items above stayed in place. This pass did not redesign Marketplace, Fleet, Add Vehicle, My Trips, Login, or the sidebar logo.

What was still wrong: Carrier Home asked for three columns from 1440px, but `md:grid-cols-2` was generated later in the stylesheet and kept two columns. The cards also used a sparse label grid.

What changed:

- Added the `desk` breakpoint at 87.5rem so three columns win at a 1440px viewport and two columns remain at 1280px.
- Home trip cards now lead with the route, then cargo, temperature, vehicle requirement, and pickup date. The price stays on one line. Phân công or Xem sits at the bottom of the card.

Kept on purpose:

- One real Marketplace and `MarketShipmentCard`. No preview route and no fake published shipments.
- White COLDI mark on the navy sidebar, with no white box. The sidebar stays sticky.
- Fleet card and the centered 896px Add Vehicle form. Fields and payload are unchanged.
- My Trips groups and assignment controls. No `MATCHED` string in the page text.
- Carrier detail was not edited. A delivered trip still shows five timeline events in the page flow and no raw status enum.

Browser, local demo data, no writes:

- 1440: home cards are three columns, about 355px wide, no horizontal overflow.
- 1280: home cards are two columns. Prices stay on one line.
- Marketplace: 0 published shipments. Empty state only. Live cards were not rendered.
- Fleet, Add Vehicle, and My Trips were reviewed at 1440 and left as they were. The form stays centered at 1280 (`centerDelta` 0, width 896).
- No vehicle was saved and no assignment was submitted.

`npm run lint`, `npx tsc -b`, and `npm run build` in `web/` passed after this change. Backend code was not changed.

Visual acceptance is still pending. FE-05B has not started.
