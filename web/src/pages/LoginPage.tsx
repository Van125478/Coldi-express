import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { isRolePath, parseAuthAction, paths, workspaceHome } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { authMessages } from "@/content/publicCopy";
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
  DRIVER: "Xem chuyến được nhà xe phân công khi phần này mở.",
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
      setError("Nhập email và mật khẩu.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const user = await login(email, password);
      const destination = nextPath && isRolePath(user.role, nextPath) ? nextPath : workspaceHome(user.role);
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không đăng nhập được. Hãy thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-svh bg-canvas lg:grid lg:grid-cols-[minmax(20rem,0.86fr)_minmax(24rem,1.14fr)]">
      <aside className="relative hidden overflow-hidden bg-navy-deep text-white lg:flex lg:min-h-svh lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <Logo tone="inverse" />
        <div className="max-w-md">
          <p className="text-xs font-semibold tracking-[0.16em] text-white/60">VẬN TẢI LẠNH</p>
          <h2 className="mt-4 text-4xl leading-tight font-extrabold">Kết nối chủ hàng và nhà xe</h2>
          <ol className="mt-8 space-y-4 text-sm leading-relaxed text-white/80">
            <li>01 · Chủ hàng niêm yết đơn. Đơn mới ở trạng thái Đang tìm xe.</li>
            <li>02 · Nhà xe tự nhận chuyến. Gọi điện không giữ chỗ.</li>
            <li>03 · Sau khi nhận, nhà xe phân công xe và tài xế.</li>
          </ol>
        </div>
        <p className="text-sm text-white/55">© 2026 COLDI</p>
      </aside>
      <section className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10 lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link to={paths.home} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">
            Về trang chủ
          </Link>
        </header>
        <div className="flex flex-1 items-center px-5 pb-10 sm:px-10">
          <div className="mx-auto w-full max-w-lg">
            {snapshot.status === "authenticated" ? (
              <SignedIn email={snapshot.user.email} role={snapshot.user.role} onLogout={() => void logout()} />
            ) : (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight text-ink">Chào mừng trở lại</h1>
                <p className="mt-2 text-base leading-relaxed text-muted">Đăng nhập để vào khu làm việc của tài khoản đã cấp.</p>
                {context ? (
                  <div className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed">
                    <p className="font-semibold text-ink">{context.title}</p>
                    <p className="mt-1 text-muted">{context.body}</p>
                  </div>
                ) : null}
                <form className="mt-8 space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
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
                  <Button type="submit" size="lg" disabled={pending || snapshot.status === "loading"} aria-busy={pending}>
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

function SignedIn({ email, role, onLogout }: { email: string; role: BusinessRole; onLogout: () => void }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-navy">PHIÊN ĐANG MỞ</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Đã đăng nhập</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">{roleWork[role]}</p>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">Tài khoản</p>
        <p className="mt-1 text-lg font-bold text-ink">{email}</p>
        <p className="mt-3 text-sm text-muted">Vai trò</p>
        <p className="mt-1 text-base font-semibold text-navy">{roleLabels[role]}</p>
      </div>
      <Link to={workspaceHome(role)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep">
        Vào khu làm việc
      </Link>
      <Button type="button" variant="outline" size="lg" className="mt-3" onClick={onLogout}>
        Đăng xuất
      </Button>
    </div>
  );
}
