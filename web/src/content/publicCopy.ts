export const designPresentationNote =
  "Các chỉ số, điểm đánh giá và dòng cam kết trên trang chủ lấy từ bản thiết kế Guest. Chúng chưa phải số liệu vận hành đã kiểm chứng hay chính sách đã phê duyệt.";

export const heroCopy = {
  eyebrow: "Trải nghiệm giao vận minh bạch B2B",
  titleLead: "Kết nối vận tải",
  titleAccent: "Minh bạch & tối ưu",
  lede: "Nền tảng trực tiếp kết nối chủ hàng và đội xe tải trên toàn quốc. Tìm chuyến dễ dàng, tối ưu giá cước thực tế, không qua trung gian môi giới phức tạp.",
  primaryCta: "Tìm chuyến ngay",
  secondaryCta: "Đăng đơn hàng",
  platformLabel: "Hỗ trợ đa nền tảng",
  downloadLabel: "Tải ứng dụng Desktop & Mobile",
  ratingValue: "4.9/5",
  ratingCaption: "Hơn 1.000 chuyến hàng và tài xế đã kết nối thành công",
};

export const trustItems = [
  { id: "shield", label: "Cam kết COLDI Shield", icon: "shield" },
  { id: "contract", label: "Hợp đồng điện tử ký số", icon: "file" },
  { id: "rate", label: "Cước phí minh bạch", icon: "receipt" },
] as const;

export const proofPoints = [
  {
    id: "trips",
    value: "12.500+",
    label: "Chuyến hàng hoàn thành",
    detail: "Tỷ lệ giao hàng đúng hẹn 99.4%",
    tone: "navy",
  },
  {
    id: "carriers",
    value: "3.200+",
    label: "Nhà xe & Tài xế xác minh",
    detail: "Kiểm định hồ sơ pháp lý kỹ lưỡng",
    tone: "navy",
  },
  {
    id: "contracts",
    value: "100%",
    label: "Hợp đồng ký kết minh bạch",
    detail: "Hóa đơn VAT & bảo hiểm đầy đủ",
    tone: "success",
  },
  {
    id: "claim-time",
    value: "15 – 30p",
    label: "Khớp lệnh nhận chuyến",
    detail: "Nhà xe tự bấm nhận trên sàn",
    tone: "success",
  },
] as const;

export const platformNames = ["Windows", "macOS", "Android", "iOS"] as const;

export const aboutStory = {
  eyebrow: "Về COLDI",
  title: "Nối hàng lạnh với xe lạnh.",
  lede: "COLDI là nền tảng vận tải lạnh cho doanh nghiệp. Chủ hàng đăng nhu cầu. Nhà xe tự tìm chuyến và tự nhận.",
  problemTitle: "Hàng lạnh cần đúng xe, đúng lúc.",
  problem:
    "Chủ hàng có hàng cần giữ lạnh. Nhà xe có xe lạnh nhưng không phải lúc nào cũng thấy được nhu cầu phù hợp. Việc kết nối thường nằm ngoài một nơi chung.",
  approachTitle: "Một nơi để đăng đơn, tìm chuyến và phối hợp vận chuyển.",
  approach:
    "Chủ hàng mô tả hàng, điểm lấy, điểm giao và nhóm nhiệt. Nhà xe đã đăng nhập xem các đơn đang mở, tự nhận chuyến, rồi giao xe và tài xế. Hành trình được ghi lại theo những gì đã xảy ra.",
  audiences: [
    { label: "Chủ hàng", body: "Doanh nghiệp có hàng cần vận chuyển lạnh." },
    { label: "Nhà xe", body: "Đơn vị có xe lạnh, tự chọn chuyến phù hợp." },
    { label: "Tài xế", body: "Làm việc trên chuyến mà nhà xe đã giao. Tài khoản do nhà xe cấp." },
  ],
  pilotTitle: "Phạm vi ưu tiên của giai đoạn đầu",
  pilotNote: "Đây là phạm vi pilot dự kiến, chưa phải mạng lưới đang khai thác.",
  origins: ["Tiền Giang", "Long An"],
  hubs: ["TP. Hồ Chí Minh", "Bình Dương", "Đồng Nai"],
  cargo: [
    { label: "Lạnh mát", body: "Trái cây và nông sản tươi." },
    { label: "Đông", body: "Thủy hải sản." },
  ],
  cargoNote: "COLDI còn ghi nhận nhóm Cực lạnh. Ưu tiên ban đầu là Lạnh mát và Đông.",
  qualification: "Phí nền tảng và thanh toán chưa thuộc phần đang vận hành.",
} as const;

export const solutions = {
  "chu-hang": {
    pageTitle: "Dành cho chủ hàng",
    eyebrow: "Giải pháp · Chủ hàng",
    title: "Chủ động gửi hàng lạnh, theo dõi hành trình rõ ràng.",
    lede: "Đăng nhu cầu vận chuyển với hàng hóa, điểm lấy, điểm giao và nhóm nhiệt. Nhà xe xem đơn và tự nhận chuyến. Bạn theo dõi trạng thái, mốc đã ghi và vị trí xe khi chuyến cho phép.",
    benefitsTitle: "Chủ hàng làm được những việc này",
    benefits: [
      { title: "Mô tả đúng nhu cầu", body: "Hàng hóa, điểm lấy, điểm giao, nhóm nhiệt và yêu cầu xe nằm trên cùng một đơn." },
      { title: "Để nhà xe tìm thấy đơn", body: "Đơn đã đăng xuất hiện để nhà xe đã đăng nhập xem và tự nhận." },
      { title: "Theo dõi tiến độ vận chuyển", body: "Trạng thái và các mốc đã ghi đi cùng đơn. Vị trí xe hiện khi chuyến đã cho phép xem." },
    ],
    journeyTitle: "Từ đơn nháp đến chuyến đang chạy",
    journey: [
      { title: "Tạo đơn", body: "Chủ hàng đăng nhu cầu vận chuyển." },
      { title: "Nhà xe nhận chuyến", body: "Nhà xe tự xem và tự nhận. COLDI không tự ghép xe." },
      { title: "Vận chuyển và theo dõi", body: "Chuyến đi tiếp theo phân công và các mốc đã được ghi." },
    ],
    cta: "Đăng nhập để đăng đơn",
    action: "publish",
  },
  "nha-xe": {
    pageTitle: "Dành cho nhà xe",
    eyebrow: "Giải pháp · Nhà xe",
    title: "Tìm chuyến hàng lạnh phù hợp với đội xe của bạn.",
    lede: "Sau khi đăng nhập, nhà xe xem các đơn đang tìm xe, lọc theo nhu cầu, rồi tự nhận chuyến. Xe và tài xế được giao sau khi đã nhận.",
    benefitsTitle: "Nhà xe làm được những việc này",
    benefits: [
      { title: "Xem đơn đang mở", body: "Đăng nhập để khám phá các chuyến hàng đang được niêm yết." },
      { title: "Lọc theo nhu cầu thật", body: "Hàng, tuyến, nhóm nhiệt, xe yêu cầu, lịch lấy và giá niêm yết đều có trên đơn." },
      { title: "Tự nhận, rồi phân công", body: "Nhà xe tự nhận chuyến còn mở, sau đó chọn xe và tài xế của mình." },
    ],
    journeyTitle: "Từ đơn đang mở đến chuyến của đội xe",
    journey: [
      { title: "Tìm chuyến", body: "Xem và lọc các đơn đang tìm xe." },
      { title: "Nhận chuyến", body: "Nhà xe tự nhận. Không có điều phối tự động." },
      { title: "Giao xe và tài xế", body: "Chuyến đã nhận được phân công trong đội xe của nhà xe." },
    ],
    fleetTitle: "Quản lý đội xe và tài xế",
    fleet: "Nhà xe quản lý xe lạnh và tài khoản tài xế của mình. Tài xế làm việc trên chuyến đã được giao, không tự mở sàn để nhận chuyến.",
    cta: "Đăng nhập để vào sàn",
    action: "claim",
  },
} as const;

export type SolutionId = keyof typeof solutions;

export const authMessages = {
  publish: {
    title: "Đăng đơn cần tài khoản Chủ hàng",
    body: "Đăng nhập bằng tài khoản Chủ hàng để niêm yết đơn. Đơn đã đăng ở trạng thái Đang tìm xe.",
  },
  claim: {
    title: "Nhận chuyến cần tài khoản Nhà xe",
    body: "Gọi điện hoặc nhắn tin không giữ chỗ. Nhà xe đăng nhập để xem đơn Đang tìm xe và tự nhận chuyến. Nhận chuyến chưa gán xe hoặc tài xế.",
  },
  account: {
    title: "Vào khu làm việc",
    body: "Dùng tài khoản đã cấp để vào đúng khu làm việc. Hồ sơ doanh nghiệp và chứng từ chưa mở. Trao đổi và vị trí chỉ có trên chuyến mà tài khoản được xem.",
  },
  general: {
    title: "Đăng nhập",
    body: "Dùng email và mật khẩu của tài khoản đã được cấp.",
  },
} as const;
