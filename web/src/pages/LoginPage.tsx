import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { parseAuthAction, paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { LogisticsSketch } from "@/features/guest/sketch/LogisticsSketch";
import { authMessages } from "@/content/publicCopy";
import { usePageTitle } from "@/hooks/usePageTitle";

const lanes = [
  { label: "Điểm lấy", places: ["Tiền Giang", "Long An"] },
  { label: "Điểm giao", places: ["TP.HCM", "Bình Dương", "Đồng Nai"] },
] as const;

const temperatures = ["Lạnh mát", "Đông", "Cực lạnh"] as const;

export function LoginPage() {
  usePageTitle("Đăng nhập");
  const [params] = useSearchParams();
  const action = parseAuthAction(params.get("action"));
  const message = authMessages[action];
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [resetNote, setResetNote] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPassword("");
    setSubmitted(true);
  }

  return (
    <div className="min-h-svh bg-surface lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden min-w-0 bg-[#0b1736] text-white lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(37,99,235,0.38),transparent_52%)]" />
        <div className="relative flex h-svh min-w-0 flex-col justify-between overflow-y-auto px-8 py-8 xl:px-14">
          <Logo tone="inverse" />
          <div className="my-10 max-w-lg">
            <p className="text-xs font-bold tracking-[0.18em] text-white/55 uppercase">Chuỗi lạnh đường bộ</p>
            <h2 className="mt-4 text-4xl leading-[1.12] font-extrabold text-balance">Vận tải lạnh, kết nối trực tiếp</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Chủ hàng niêm yết đơn. Nhà xe tự nhận chuyến. Đăng nhập không tạo phiên và không nhận chuyến thay cho Nhà xe.
            </p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white">
              <LogisticsSketch className="h-52" />
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] font-bold tracking-[0.16em] text-white/50 uppercase">Phạm vi pilot</p>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
                {lanes.map((lane, index) => (
                  <div key={lane.label} className={index === 1 ? "col-start-3" : undefined}>
                    <p className="text-xs text-white/50">{lane.label}</p>
                    <ul className="mt-2 space-y-1">
                      {lane.places.map((place) => (
                        <li key={place} className="text-sm font-semibold">
                          {place}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="col-start-2 row-start-1 mt-7 h-px w-8 bg-white/35" aria-hidden="true" />
              </div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {temperatures.map((item) => (
                  <li key={item} className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/85">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-white/55">
                Nhóm nhiệt giới thiệu, không gắn mức °C mặc định. Không phải chuyến đang theo dõi.
              </p>
            </div>
          </div>
          <p className="text-sm text-white/55">© 2026 Coldi Freight</p>
        </div>
      </aside>

      <section className="flex min-h-svh min-w-0 flex-col lg:h-svh lg:overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-8 lg:px-10">
          <div className="min-w-0 lg:hidden">
            <Logo />
          </div>
          <Link to={paths.home} className="ml-auto inline-flex min-h-11 items-center text-sm font-semibold text-navy">
            Về trang chủ
          </Link>
        </header>
        <div className="flex w-full flex-1 items-start justify-center px-4 pt-2 pb-10 sm:px-8 lg:items-center lg:px-10">
          <div className="w-full max-w-md min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">Đăng nhập</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">Dùng tài khoản Coldi khi hệ thống xác thực được nối.</p>
            <div className="mt-5 rounded-2xl border border-warning-line bg-warning-bg p-4 text-sm leading-relaxed text-warning">
              <p className="font-semibold">{message.title}</p>
              <p className="mt-1">{message.body}</p>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" autoComplete="username" placeholder="ten@congty.vn" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 -translate-y-1/2 text-muted"
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setVisible((value) => !value)}
                  >
                    {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" className="h-auto min-h-11 px-2 text-navy" onClick={() => setResetNote(true)}>
                  Quên mật khẩu?
                </Button>
              </div>
              {resetNote ? (
                <p role="status" className="text-sm leading-relaxed text-muted">
                  Khôi phục mật khẩu chưa được triển khai.
                </p>
              ) : null}
              <Button type="submit" size="lg">
                Đăng nhập
              </Button>
              {submitted ? (
                <p role="status" className="text-sm leading-relaxed text-ink">
                  Không có yêu cầu đăng nhập nào được gửi. Mật khẩu đã được xóa khỏi ô nhập.
                </p>
              ) : null}
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              Chưa có tài khoản?{" "}
              <Link to={{ pathname: paths.register, search: params.toString() }} className="font-semibold text-navy">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
