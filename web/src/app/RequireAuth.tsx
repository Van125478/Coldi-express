import { Navigate, useLocation } from "react-router-dom";
import { authPath } from "@/app/paths";
import { readSession } from "@/services/sessionService";

export function RequireAuth() {
  const location = useLocation();
  const session = readSession();

  if (session.status === "anonymous") {
    return <Navigate to={authPath("publish", location.pathname)} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold text-navy">Đăng đơn chưa mở</h1>
      <p className="mt-3 text-base leading-relaxed text-ink">
        API tạo đơn chưa được nối. Một phiên đăng nhập, khi có, vẫn chưa đủ để niêm yết chuyến từ trang này.
      </p>
    </div>
  );
}
