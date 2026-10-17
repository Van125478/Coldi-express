import { Link } from "react-router-dom";
import { paths } from "@/app/paths";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">© 2026 Coldi Freight</p>
        <nav aria-label="Liên kết chân trang" className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
          <Link to={paths.home} className="text-ink hover:text-navy">
            Trang chủ
          </Link>
          <Link to={paths.shipments} className="text-ink hover:text-navy">
            Tìm chuyến hàng
          </Link>
          <Link to={paths.about} className="text-ink hover:text-navy">
            Về chúng tôi
          </Link>
          <Link to={paths.login} className="text-ink hover:text-navy">
            Đăng nhập
          </Link>
        </nav>
      </div>
      <p className="mx-auto w-full max-w-7xl px-4 pb-6 text-sm leading-relaxed text-muted sm:px-6">
        Khách chưa đăng nhập không đăng đơn, không nhận chuyến và không xem dữ liệu doanh nghiệp.
      </p>
    </footer>
  );
}
