import type { ShipmentPreview } from "@/models/shipment";

/**
 * Static visual sample copied from the Guest landing design.
 * It is not a published cold-chain order and must not be claimed.
 */
export const illustrativeShipment: ShipmentPreview = {
  id: "CD-8924",
  origin: "TP. Hồ Chí Minh",
  destination: "Đà Nẵng",
  distanceLabel: "Khoảng cách: ~960 km qua QL1A • Dự kiến 20 giờ",
  readyTrucksLabel: "428 xe tải sẵn sàng",
  boardStatusLabel: "Đang nhận xe",
  cargoType: "Điện tử linh kiện",
  weightLabel: "2.5 tấn (85 kiện)",
  vehicleRequirement: "Thùng kín 3.5T",
  pickup: {
    title: "KCN Tân Bình, Tây Thạnh, Tân Phú",
    note: "Bốc hàng tại Kho A2 • Hỗ trợ xe nâng",
    timeLabel: "08:00, Hôm nay",
  },
  dropoff: {
    title: "KCN Hòa Khánh, Liên Chiểu, Đà Nẵng",
    note: "Giao hàng tại Trung tâm Phân phối Miền Trung",
    timeLabel: "06:00, Ngày mai",
  },
  recentActivity: {
    name: "Tài xế Nguyễn Văn Hùng",
    detail: "Vừa nhận chuyến #CD-8924 • 2 phút trước",
  },
  illustrative: true,
};
