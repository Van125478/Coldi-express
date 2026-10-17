import { Link, Navigate } from "react-router-dom";
import { authPath, paths, workspaceHome } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";

export function LegacyPublishRedirect() {
  const { snapshot } = useAuth();

  if (snapshot.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-6">
        <p className="text-sm text-muted">Đang kiểm tra phiên đăng nhập.</p>
      </div>
    );
  }

  if (snapshot.status === "anonymous") {
    return <Navigate to={authPath("publish", paths.shipperCreate)} replace />;
  }

  if (snapshot.user.role === "SHIPPER") {
    return <Navigate to={paths.shipperCreate} replace />;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <section className="max-w-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Trang này dành cho Chủ hàng.</h1>
        <p className="mt-4 text-base leading-7 text-muted">{snapshot.user.email} không mở được trang tạo đơn.</p>
        <Link to={workspaceHome(snapshot.user.role)} className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-navy">
          Về khu làm việc
        </Link>
      </section>
    </div>
  );
}
