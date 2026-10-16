import { paths } from "@/app/paths";

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

export const aboutFacts = [
  {
    term: "Sản phẩm",
    detail:
      "COLDI là nền tảng logistics lạnh B2B. Bản giao diện này là website đáp ứng, dùng chung định hướng một tài khoản với ứng dụng di động khi ứng dụng đó được phát hành.",
  },
  {
    term: "Khách",
    detail:
      "Người chưa đăng nhập chỉ xem thông tin công khai. Khách không phải vai trò nghiệp vụ và không có quyền Chủ hàng, Nhà xe, Tài xế hay Quản trị.",
  },
  {
    term: "Bốn vai trò",
    detail:
      "Chủ hàng đăng đơn. Nhà xe xem sàn và tự nhận chuyến, rồi tự gán xe và tài xế. Tài xế chỉ xử lý chuyến được giao. Quản trị là vận hành nội bộ COLDI.",
  },
  {
    term: "Phạm vi pilot",
    detail:
      "Tiền Giang và Long An tới TP. Hồ Chí Minh, Bình Dương và Đồng Nai. Nhóm hàng ưu tiên là rau quả tươi hoặc lạnh và thủy sản đông lạnh.",
  },
  {
    term: "Cách nhận chuyến",
    detail:
      "Không tự động ghép đơn, điều phối hay gán xe. Nhà xe bấm nhận chuyến; máy chủ phải khóa đơn để chỉ một nhà xe thành công. Gọi điện hoặc chat không giữ chỗ.",
  },
  {
    term: "Lấy hàng và giao hàng",
    detail:
      "Sau khi được gán, chuyến chờ lấy hàng. Tài xế được giao xác nhận lấy hàng trước khi chuyến chuyển sang đang vận chuyển, và xác nhận giao hàng khi hoàn thành. GPS chỉ theo dõi vị trí.",
  },
  {
    term: "Tài chính",
    detail:
      "Phí nền tảng, công nợ, hạn mức, ký quỹ và tạm ứng cước chưa được phê duyệt. Trang này không trình bày các hạng mục đó như quy định đang áp dụng.",
  },
] as const;

export const solutions = {
  "chu-hang": {
    title: "Dành cho chủ hàng",
    lede: "Chủ hàng tạo và niêm yết đơn vận tải lạnh, rồi theo dõi chuyến theo quyền của mình.",
    points: [
      "Đăng đơn với hàng hóa, điểm lấy, điểm giao, nhóm nhiệt độ, yêu cầu xe và giá cước niêm yết.",
      "Đơn đã đăng ở trạng thái đang tìm xe trên sàn công khai.",
      "Trao đổi với nhà xe theo đơn không tạo lượt nhận chuyến và không giữ chỗ.",
      "Xem mốc chuyến và vị trí GPS khi đã có quyền trên chuyến đó.",
    ],
    limit:
      "Tạo đơn chưa mở trên website này. Biểu mẫu và API đăng đơn chưa được nối, nên khách không thể niêm yết chuyến.",
    actionLabel: "Đăng đơn cần đăng nhập",
    action: "publish" as const,
    actionNext: paths.publish,
  },
  "nha-xe": {
    title: "Dành cho nhà xe",
    lede: "Nhà xe tự xem đơn đang tìm xe, tự bấm nhận chuyến, rồi tự chọn xe và tài xế.",
    points: [
      "Xem lộ trình, quy cách hàng, nhóm nhiệt độ và giá niêm yết của đơn đang tìm xe.",
      "Bấm nhận chuyến. Chỉ một nhà xe thành công sau khi máy chủ xác nhận.",
      "Sau khi nhận, nhà xe tự gán xe và tài xế. Chuyến khi đó đang chờ lấy hàng.",
      "Tài xế trực thuộc không tự mở sàn và không tự nhận chuyến.",
    ],
    limit:
      "Nút nhận chuyến trên trang khách không gửi yêu cầu. Việc nhận chuyến phải do máy chủ kiểm tra khi tài khoản Nhà xe và API đã sẵn sàng.",
    actionLabel: "Nhận chuyến cần đăng nhập",
    action: "claim" as const,
    actionNext: paths.shipments,
  },
} as const;

export type SolutionId = keyof typeof solutions;

export const authMessages = {
  publish: {
    title: "Đăng đơn cần tài khoản Chủ hàng",
    body: "Khách chưa đăng nhập không thể tạo hoặc niêm yết đơn. Giao thức đăng nhập và API tạo đơn chưa được kết nối, nên biểu mẫu này không gửi dữ liệu và không tạo đơn.",
  },
  claim: {
    title: "Nhận chuyến cần tài khoản Nhà xe",
    body: "Chỉ Nhà xe đã đăng nhập mới được nhận chuyến, và máy chủ phải khóa đơn để chỉ một nhà xe thành công. Bản này chưa gọi API nhận chuyến, nên không giữ chỗ và không đổi trạng thái đơn.",
  },
  account: {
    title: "Chưa có phiên đăng nhập",
    body: "Khách không xem hồ sơ doanh nghiệp, đội xe, tài xế, chứng từ, chat hay GPS của một chuyến thật.",
  },
  general: {
    title: "Đăng nhập chưa được kết nối",
    body: "Giao thức xác thực, token và phiên làm việc đang chờ quyết định kỹ thuật. Biểu mẫu không xác thực người dùng và không lưu mật khẩu.",
  },
} as const;
