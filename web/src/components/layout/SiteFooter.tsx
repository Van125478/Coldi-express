import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { paths } from "@/app/paths";

const explore = [
  { label: "Trang chủ", to: paths.home },
  { label: "Tìm chuyến hàng", to: paths.shipments },
  { label: "Về chúng tôi", to: paths.about },
] as const;

const solutions = [
  { label: "Giải pháp cho chủ hàng", to: paths.shipperSolution },
  { label: "Giải pháp cho nhà xe", to: paths.carrierSolution },
  { label: "Đăng nhập", to: paths.login },
] as const;

const linkClass = "inline-flex min-h-11 items-center text-sm font-semibold text-[#1e293b] hover:text-[#1e3a8a]";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-white text-[#1e293b]">
      <div className="guest-frame pt-10 pb-6 sm:pt-12 sm:pb-8">
        <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-[minmax(32rem,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] xl:items-start xl:gap-x-16">
          <div className="sm:col-span-2 xl:col-span-1">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">COLDI · VẬN TẢI LẠNH B2B</p>
            <p className="mt-4 max-w-xl text-[1.75rem] leading-[1.15] font-extrabold tracking-tight text-[#172554] sm:text-4xl lg:text-[2.75rem]">
              Kết nối vận tải lạnh.
              <br />
              Rõ ràng từng hành trình.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#475569]">
              Chủ hàng niêm yết nhu cầu vận chuyển. Nhà xe tự nhận chuyến, rồi phân công xe và tài xế.
            </p>
          </div>
          <nav aria-label="Khám phá" className="xl:pt-12">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1e3a8a]">KHÁM PHÁ</p>
            <ul className="mt-2">
              {explore.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Giải pháp" className="xl:pt-12">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1e3a8a]">GIẢI PHÁP</p>
            <ul className="mt-2">
              {solutions.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[#e2e8f0] pt-5">
          <Logo />
          <p className="text-sm font-medium text-[#475569]">© 2026 COLDI</p>
        </div>
      </div>
      <div className="h-1 bg-[#172554]" aria-hidden="true" />
    </footer>
  );
}
