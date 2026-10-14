import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { usePageTitle } from "@/hooks/usePageTitle";

export function PlatformPage() {
  usePageTitle("Nền tảng");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Nền tảng Coldi</h1>
      <p className="mt-3 text-base leading-relaxed text-ink">
        Bản đang mở là website đáp ứng. Có thể dùng trên trình duyệt máy tính, máy tính bảng và điện thoại.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm leading-relaxed text-ink">
        Tài liệu sản phẩm còn mô tả ứng dụng iOS và Android dùng chung tài khoản. Bản giao diện khách này chưa phát hành tệp cài đặt cho Desktop, Android hay iOS, nên không có liên kết tải.
      </div>
      <Link to={paths.home} className="mt-6 inline-flex min-h-11 items-center font-semibold text-navy">
        Về trang chủ
      </Link>
    </div>
  );
}
