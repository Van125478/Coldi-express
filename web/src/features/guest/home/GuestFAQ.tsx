import { Link } from "react-router-dom";
import { paths } from "@/app/paths";

const questions = [
  {
    id: "faq-who",
    question: "COLDI dành cho những ai?",
    answer:
      "COLDI là nền tảng logistics lạnh B2B. Chủ hàng niêm yết nhu cầu vận chuyển. Nhà xe tự xem sàn và nhận chuyến, rồi phân công xe và tài xế. Tài xế chỉ thực hiện chuyến được giao.",
  },
  {
    id: "faq-claim",
    question: "Nhà xe có được chủ động lựa chọn chuyến hàng không?",
    answer:
      "Có. Nhà xe tự xem đơn đang mở và tự nhận chuyến. COLDI không tự ghép, không tự điều phối và không tự gán tài xế. Chỉ một nhà xe nhận được mỗi đơn. Nhận chuyến chưa gán xe hay tài xế.",
  },
  {
    id: "faq-contact",
    question: "Gọi điện hoặc nhắn tin có giữ chỗ chuyến hàng không?",
    answer: "Không. Gọi điện hoặc chat theo đơn chỉ để trao đổi. Liên hệ không giữ chỗ và không nhận chuyến.",
  },
  {
    id: "faq-track",
    question: "Chủ hàng có thể theo dõi tiến độ vận chuyển như thế nào?",
    answer:
      "Khi đã có quyền trên chuyến, chủ hàng theo dõi các mốc nghiệp vụ. Tài xế được phân công xác nhận lấy hàng và giao hàng. GPS chỉ bổ sung vị trí và thời điểm, không tự xác nhận giao hàng.",
  },
  {
    id: "faq-pilot",
    question: "COLDI ưu tiên những khu vực và nhóm hàng nào?",
    answer:
      "Phạm vi pilot dự kiến đi từ Tiền Giang và Long An tới hub phân phối tại TP. Hồ Chí Minh, Bình Dương và Đồng Nai. Hàng ưu tiên là trái cây và nông sản tươi ở nhóm Lạnh mát, và thủy hải sản ở nhóm Đông. COLDI còn ghi nhận Cực lạnh. Tuyến Bắc–Nam và xuất khẩu qua cửa khẩu là hướng mở rộng sau. Đây chưa phải mạng lưới đang khai thác.",
  },
  {
    id: "faq-start",
    question: "Làm sao để bắt đầu sử dụng COLDI?",
    answer: "Đọc giải pháp theo vai trò để hiểu cách làm việc. Đăng nhập trên website này chưa tạo phiên, chưa đăng đơn và chưa nhận chuyến.",
  },
] as const;

export function GuestFAQ() {
  return (
    <section className="border-t border-[#e2e8f0] bg-white text-[#1e293b]" aria-labelledby="faq-title">
      <div className="guest-frame py-12 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">CÂU HỎI THƯỜNG GẶP</p>
            <h2 id="faq-title" className="mt-3 max-w-xs text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
              Những điều bạn muốn biết về COLDI.
            </h2>
          </div>

          <div className="border-t border-[#e2e8f0] lg:col-span-8">
            {questions.map((item, index) => (
              <details key={item.id} id={item.id} className="group border-b border-[#e2e8f0]" open={index === 0}>
                <summary
                  aria-controls={`${item.id}-answer`}
                  className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e3a8a] [&::-webkit-details-marker]:hidden"
                >
                  <h3 className="text-base leading-snug font-extrabold tracking-tight sm:text-lg">{item.question}</h3>
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 border-r-2 border-b-2 border-[#1e3a8a] rotate-45 motion-safe:transition-transform group-open:rotate-[-135deg]"
                  />
                </summary>
                <div id={`${item.id}-answer`} className="pb-4 pr-6">
                  <p className="max-w-2xl text-sm leading-relaxed text-[#475569] sm:text-base">{item.answer}</p>
                  {item.id === "faq-start" ? (
                    <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                      <Link to={paths.shipperSolution} className="inline-flex min-h-11 items-center text-sm font-bold text-[#1e3a8a] underline-offset-4 hover:underline">
                        Giải pháp cho chủ hàng
                      </Link>
                      <Link to={paths.carrierSolution} className="inline-flex min-h-11 items-center text-sm font-bold text-[#1e3a8a] underline-offset-4 hover:underline">
                        Giải pháp cho nhà xe
                      </Link>
                    </p>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
