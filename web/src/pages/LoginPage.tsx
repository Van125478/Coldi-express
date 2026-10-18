import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { parseAuthAction, paths } from "@/app/paths";
import { destinationAfterLogin } from "@/features/auth/driverAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { authMessages } from "@/content/publicCopy";
import roadStill from "@/features/transition-lab/keyframe-04-high-angle-road.jpg";
import { useAuth } from "@/features/auth/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { BusinessRole } from "@/models/session";
import { ApiError } from "@/services/apiClient";

const roleLabels: Record<BusinessRole, string> = {
  SHIPPER: "Chủ hàng",
  CARRIER: "Nhà xe",
  DRIVER: "Tài xế",
  ADMIN: "Quản trị",
};

const roleWork: Record<BusinessRole, string> = {
  SHIPPER: "Niêm yết đơn và theo dõi đơn của tài khoản.",
  CARRIER: "Xem đơn đang tìm xe, nhận chuyến và phân công đội xe.",
  DRIVER: "Xem chuyến được nhà xe phân công, rồi xác nhận lấy hàng và giao hàng.",
  ADMIN: "Khu vận hành quản trị chưa mở.",
};

function safeNextPath(value: string | null): string | null {
  if (value === null || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

export function LoginPage() {
  usePageTitle("Đăng nhập");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const action = parseAuthAction(params.get("action"));
  const nextPath = safeNextPath(params.get("next"));
  const { snapshot, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = action === "general" ? null : authMessages[action];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().length === 0 || password.length === 0) {
      setError("Nhập email hoặc tên đăng nhập và mật khẩu.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(destinationAfterLogin(user, nextPath), { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không đăng nhập được. Hãy thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-svh bg-white lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(26rem,0.88fr)]">
      <aside className="relative hidden overflow-hidden bg-navy-deep text-white lg:flex lg:min-h-svh lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
        <img src={roadStill} alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_46%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/80 via-navy-deep/36 to-navy-deep/8" />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between">
          <Logo tone="inverse" mark="light" />
          <div className="max-w-md">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-white/80">VẬN TẢI LẠNH B2B</p>
            <h2 className="mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance xl:text-5xl">Rõ từng hành trình lạnh.</h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/85">Một cổng vào cho chủ hàng, nhà xe, tài xế và quản trị.</p>
          </div>
          <p className="text-sm text-white/75">© 2026 COLDI</p>
        </div>
      </aside>
      <section className="flex min-h-svh flex-col bg-white">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10 lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link to={paths.home} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">
            Về trang chủ
          </Link>
        </header>
        <div className="flex flex-1 items-center px-6 py-10 sm:px-12 lg:px-14 xl:px-16">
          <div className="animate-rise w-full max-w-xl">
            {snapshot.status === "authenticated" ? (
              <SignedIn user={snapshot.user} onLogout={() => void logout()} />
            ) : (
              <>
                <h1 className="text-4xl font-extrabold tracking-tight text-ink">Đăng nhập</h1>
                <p className="mt-3 max-w-md text-base leading-relaxed text-muted">Đăng nhập để tiếp tục quản lý công việc và các chuyến hàng trên COLDI.</p>
                {context ? (
                  <div className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed">
                    <p className="font-semibold text-ink">{context.title}</p>
                    <p className="mt-1 text-muted">{context.body}</p>
                  </div>
                ) : null}
                <form className="mt-8 space-y-6" onSubmit={(event) => void handleSubmit(event)} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email hoặc tên đăng nhập</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="text"
                      autoComplete="username"
                      placeholder="ten@congty.vn"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={pending || snapshot.status === "loading"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        name="password"
                        type={visible ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={pending || snapshot.status === "loading"}
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
                  <Button type="submit" size="lg" className="mt-2 h-12 w-full text-base" disabled={pending || snapshot.status === "loading"} aria-busy={pending}>
                    {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                    {pending ? "Đang đăng nhập" : "Đăng nhập"}
                  </Button>
                  {snapshot.status === "loading" ? <p className="text-sm text-muted">Đang kiểm tra phiên đăng nhập.</p> : null}
                  {error ? (
                    <p role="alert" className="text-sm leading-relaxed text-ink">
                      {error}
                    </p>
                  ) : null}
                </form>
                <p className="mt-6 text-sm leading-relaxed text-muted">Tài khoản được cấp trước. Đăng ký công khai chưa mở.</p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SignedIn({ user, onLogout }: { user: { email: string; username?: string | null; role: BusinessRole; mustChangePassword?: boolean }; onLogout: () => void }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-navy">PHIÊN ĐANG MỞ</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Đã đăng nhập</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">{roleWork[user.role]}</p>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">Tài khoản</p>
        <p className="mt-1 text-lg font-bold text-ink">{user.username || user.email}</p>
        <p className="mt-3 text-sm text-muted">Vai trò</p>
        <p className="mt-1 text-base font-semibold text-navy">{roleLabels[user.role]}</p>
      </div>
      <Link to={destinationAfterLogin(user, null)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep">
        Vào khu làm việc
      </Link>
      <Button type="button" variant="outline" size="lg" className="mt-3" onClick={onLogout}>
        Đăng xuất
      </Button>
    </div>
  );
}
