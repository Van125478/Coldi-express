import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Icon } from "@/components/ui/Icon";
import { usePageTitle } from "@/hooks/usePageTitle";

export function RegisterPage() {
  usePageTitle("Đăng ký");
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPassword("");
    setSubmitted(true);
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Đăng ký</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">Tạo tài khoản sẽ cần quy trình xác thực và cấp quyền đã được duyệt.</p>
      <div className="mt-5 rounded-2xl border border-warning-line bg-warning-bg p-4 text-sm leading-relaxed text-warning">
        <p className="font-semibold">Chưa thể tạo tài khoản</p>
        <p className="mt-1">
          Biểu mẫu không lưu thông tin và không cấp vai trò Chủ hàng, Nhà xe, Tài xế hay Quản trị. Khách không tự nhận quyền nghiệp vụ.
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block text-sm font-semibold text-ink" htmlFor="register-name">
          Họ và tên
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-base font-normal text-ink"
          />
        </label>
        <label className="block text-sm font-semibold text-ink" htmlFor="register-email">
          Email công việc
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-line px-3 py-3 text-base font-normal text-ink"
          />
        </label>
        <label className="block text-sm font-semibold text-ink" htmlFor="register-password">
          Mật khẩu
          <span className="relative mt-2 block">
            <input
              id="register-password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-line px-3 py-3 pr-12 text-base font-normal text-ink"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted"
              aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setVisible((value) => !value)}
            >
              <Icon name={visible ? "eye-off" : "eye"} className="size-5" />
            </button>
          </span>
        </label>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-navy text-sm font-semibold text-white hover:bg-navy-deep"
        >
          Đăng ký
        </button>
        {submitted ? (
          <p role="status" className="text-sm leading-relaxed text-ink">
            Không có tài khoản nào được tạo. Mật khẩu đã được xóa khỏi ô nhập.
          </p>
        ) : null}
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Đã có tài khoản?{" "}
        <Link to={{ pathname: paths.login, search: params.toString() }} className="font-semibold text-navy">
          Đăng nhập
        </Link>
      </p>
    </section>
  );
}
