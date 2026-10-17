import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { usePageTitle } from "@/hooks/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Không tìm thấy trang");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-navy">Không tìm thấy trang</h1>
      <p className="mt-3 text-base leading-relaxed text-ink">Đường dẫn này không có trong website khách.</p>
      <Link to={paths.home} className="mt-6 inline-flex min-h-11 items-center font-semibold text-navy">
        Về trang chủ
      </Link>
    </div>
  );
}
