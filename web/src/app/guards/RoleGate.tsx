import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { authPath, workspaceHome } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import type { BusinessRole } from "@/models/session";

export function RoleGate({ role }: { role: BusinessRole }) {
  const location = useLocation();
  const { snapshot } = useAuth();

  if (snapshot.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-6">
        <p className="text-sm text-muted">Đang kiểm tra phiên đăng nhập.</p>
      </div>
    );
  }

  if (snapshot.status === "anonymous") {
    return <Navigate to={authPath("general", location.pathname)} replace />;
  }

  if (snapshot.user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-6">
        <section className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-wide text-navy">Không có quyền</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Trang này không mở với vai trò hiện tại.</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            {snapshot.user.email} không dùng được khu vực này. Mỗi vai trò chỉ mở phần việc của mình.
          </p>
          <Link
            to={workspaceHome(snapshot.user.role)}
            className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
          >
            Về khu làm việc
          </Link>
        </section>
      </div>
    );
  }

  return <Outlet />;
}
