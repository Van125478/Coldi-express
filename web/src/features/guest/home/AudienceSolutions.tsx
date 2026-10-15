import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import cargoStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import roadStill from "@/features/transition-lab/keyframe-04-high-angle-road.jpg";

const shipperSteps = ["Niêm yết nhu cầu vận chuyển", "Xem lại thông tin đơn", "Theo dõi tiến độ vận chuyển"] as const;
const carrierSteps = ["Xem chuyến phù hợp", "Tự nhận chuyến", "Phân công xe và tài xế"] as const;

function Steps({ items }: { items: readonly string[] }) {
  return (
    <ol className="mt-6 border-t border-[#e2e8f0]">
      {items.map((item, index) => (
        <li key={item} className="flex gap-4 border-b border-[#e2e8f0] py-3 text-sm leading-snug font-semibold text-[#1e293b]">
          <span className="w-6 shrink-0 text-[#1e3a8a]">{String(index + 1).padStart(2, "0")}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function AudienceSolutions() {
  return (
    <section className="bg-[#f8fafc] text-[#1e293b]" aria-labelledby="audiences-title">
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="h-px bg-[#1e3a8a]/25" />
        <h2 id="audiences-title" className="mt-12 max-w-2xl text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance sm:mt-14 sm:text-4xl">
          Hai phía kết nối. Một hành trình vận chuyển.
        </h2>

        <article className="mt-10 grid items-center gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">01 · CHỦ HÀNG</p>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight">Chủ hàng</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#475569]">
              Niêm yết nhu cầu vận chuyển lạnh với thông tin hàng hóa, điểm lấy, điểm giao và yêu cầu vận chuyển.
            </p>
            <Steps items={shipperSteps} />
            <Link to={paths.shipperSolution} className="mt-6 inline-flex min-h-11 items-center text-sm font-bold text-[#1e3a8a] underline-offset-4 hover:underline">
              Giải pháp cho chủ hàng
            </Link>
          </div>
          <figure className="lg:col-span-7">
            <img
              src={cargoStill}
              alt="Khoang lạnh mở, hàng rau quả đã xếp trong thùng xe."
              className="aspect-[4/3] w-full object-cover object-center"
            />
          </figure>
        </article>

        <article className="mt-16 grid items-center gap-8 lg:mt-24 lg:grid-cols-12 lg:gap-14">
          <figure className="order-2 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <img
              src={roadStill}
              alt="Xe lạnh trên đường đêm, nhìn từ phía trên."
              className="aspect-[4/3] w-full object-cover object-center sm:aspect-[16/10]"
            />
          </figure>
          <div className="order-1 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">02 · NHÀ VẬN TẢI</p>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight">Nhà vận tải</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#475569]">
              Chủ động xem và nhận chuyến phù hợp, sau đó phân công phương tiện và tài xế để thực hiện vận chuyển.
            </p>
            <Steps items={carrierSteps} />
            <p className="mt-4 text-sm leading-relaxed text-[#475569]">Tài xế thực hiện chuyến được phân công, không tự nhận chuyến.</p>
            <Link to={paths.carrierSolution} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[#1e3a8a] underline-offset-4 hover:underline">
              Giải pháp cho nhà xe
            </Link>
          </div>
        </article>

        <p className="mt-14 max-w-xl text-sm leading-relaxed text-[#475569]">
          Hai trang giải pháp mô tả cách làm việc. Đăng đơn và nhận chuyến cần tài khoản; đăng nhập trên bản này chưa được nối.
        </p>
      </div>
    </section>
  );
}
