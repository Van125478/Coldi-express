import { Link, Navigate } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { BusinessRole } from "@/models/session";

const carrierSteps = ["Xem đơn đang tìm xe", "Tự nhận chuyến", "Phân công xe và tài xế"] as const;

export function FindShipmentsPage() {
  usePageTitle("Tìm chuyến hàng");
  const { snapshot } = useAuth();

  if (snapshot.status === "loading") {
    return (
      <div className="guest-frame py-10">
        <p className="text-sm text-muted">Đang kiểm tra phiên đăng nhập.</p>
      </div>
    );
  }

  if (snapshot.status === "authenticated" && snapshot.user.role === "CARRIER") {
    return <Navigate to={paths.carrierFind} replace />;
  }

  const signedIn = snapshot.status === "authenticated" ? snapshot.user.role : null;

  return (
    <div className="guest-frame py-12 sm:py-16">
      <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-navy">NHÀ XE</p>
          <h1 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight text-balance text-navy sm:text-5xl">
            Tìm chuyến hàng
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink">{introFor(signedIn)}</p>
          <div className="mt-8 flex flex-col items-start gap-4">
            <PrimaryAction role={signedIn} />
            <Link
              to={paths.carrierSolution}
              className="inline-flex min-h-11 items-center text-sm font-bold text-navy underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
            >
              Giải pháp cho nhà xe
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <h2 className="text-sm font-semibold text-navy">Cách nhà xe nhận chuyến</h2>
          <ol className="mt-4 border-t border-line">
            {carrierSteps.map((step, index) => (
              <li key={step} className="flex gap-4 border-b border-line py-4 text-sm font-semibold leading-snug text-ink">
                <span className="w-6 shrink-0 text-navy">{String(index + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            Chỉ một nhà xe nhận thành công. Nhận chuyến chưa gán xe hay tài xế. Danh sách đơn đang mở không hiện với khách.
          </p>
        </div>
      </div>
    </div>
  );
}

function introFor(role: BusinessRole | null) {
  if (role === "SHIPPER") {
    return "Bạn đang dùng tài khoản Chủ hàng. Sàn nhận chuyến dành cho Nhà xe. Chủ hàng niêm yết nhu cầu vận chuyển; nhà xe tự xem đơn và tự nhận.";
  }
  if (role === "DRIVER") {
    return "Bạn đang dùng tài khoản Tài xế. Tài xế không mở sàn đơn và không nhận chuyến. Nhà xe phân công xe và tài xế sau khi đã nhận chuyến.";
  }
  if (role === "ADMIN") {
    return "Tài khoản này không mở sàn nhận chuyến. Danh sách đơn đang tìm xe chỉ dành cho Nhà xe đã đăng nhập.";
  }
  return "Đơn vận tải lạnh đã niêm yết được nhà xe xem và tự nhận sau khi đăng nhập. Khách không thấy danh sách đơn đang mở và không nhận được chuyến. Gọi điện hoặc nhắn tin không giữ chỗ.";
}

function PrimaryAction({ role }: { role: BusinessRole | null }) {
  if (role === "SHIPPER") {
    return (
      <Link
        to={paths.publish}
        className="inline-flex min-h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
      >
        Đăng đơn hàng
      </Link>
    );
  }
  if (role === "DRIVER" || role === "ADMIN") {
    return null;
  }
  return (
    <Link
      to={authPath("claim", paths.shipments)}
      className="inline-flex min-h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
    >
      Đăng nhập Nhà xe
    </Link>
  );
}
