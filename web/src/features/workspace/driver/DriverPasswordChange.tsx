import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { needsPasswordChange, validateReplacementPassword } from "@/features/auth/driverAccess";
import { useAuth } from "@/features/auth/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ApiError } from "@/services/apiClient";
import { changeRequiredPassword } from "@/services/authService";

export function DriverPasswordChange() {
  usePageTitle("Đổi mật khẩu tạm");
  const { snapshot, acceptUser, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (snapshot.status === "loading") return <p className="grid min-h-screen place-items-center text-sm text-muted">Đang kiểm tra phiên đăng nhập.</p>;
  if (snapshot.status === "anonymous") return <Navigate to={paths.login} replace />;
  if (!needsPasswordChange(snapshot.user) || done) return <Navigate to={paths.driverHome} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateReplacementPassword(password);
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const user = await changeRequiredPassword(password);
      acceptUser(user);
      setPassword("");
      setDone(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không đổi được mật khẩu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-canvas px-4 py-10">
      <p className="text-xs font-semibold tracking-[0.16em] text-navy">TÀI XẾ</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Đổi mật khẩu tạm</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">Mật khẩu nhà xe cấp chỉ dùng cho lần đăng nhập này. Đặt mật khẩu mới trước khi xem chuyến.</p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
        <div className="space-y-2">
          <Label htmlFor="new-driver-password">Mật khẩu mới</Label>
          <Input id="new-driver-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {error ? <p role="alert" className="text-sm text-ink">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Đang lưu" : "Lưu mật khẩu mới"}</Button>
      </form>
      <button type="button" className="mt-4 min-h-11 text-sm font-semibold text-navy underline-offset-4 hover:underline" onClick={() => void logout()}>
        Đăng xuất
      </button>
    </main>
  );
}
