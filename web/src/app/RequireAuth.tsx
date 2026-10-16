import { Link, Navigate, useLocation } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";

export function RequireAuth() {
  const location = useLocation();
  const { snapshot, logout } = useAuth();

  if (snapshot.status === "loading") {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm text-muted">Đang kiểm tra phiên đăng nhập.</p>
      </section>
    );
  }

  if (snapshot.status === "anonymous") {
    return <Navigate to={authPath("publish", location.pathname)} replace />;
  }

  if (snapshot.user.role !== "SHIPPER") {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-navy">Không có quyền</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Trang này dành cho Chủ hàng.</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Tài khoản {snapshot.user.email} không thể mở trang đăng đơn. Nhà xe nhận chuyến và tài xế xác nhận mốc
          chuyến ở các bước sau, chưa mở trên website này.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => void logout()}>
            Đăng xuất
          </Button>
          <Link to={paths.home} className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold text-navy">
            Về trang chủ
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-navy">Đăng đơn hàng</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Đăng đơn chưa mở</h1>
      <p className="mt-4 text-base leading-7 text-muted">
        {snapshot.user.email} đã đăng nhập với vai trò Chủ hàng. API tạo đơn chưa được nối, nên trang này chưa thể
        phát hành đơn.
      </p>
      <Button className="mt-8 w-auto" variant="outline" onClick={() => void logout()}>
        Đăng xuất
      </Button>
    </section>
  );
}
