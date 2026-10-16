import { Link } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { ShipmentPreviewCard } from "@/components/guest/ShipmentPreviewCard";
import { useAuth } from "@/features/auth/useAuth";
import { CarrierLoadBoard } from "@/features/shipments/CarrierLoadBoard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getIllustrativeShipmentPreview } from "@/services/shipmentPreviewService";

export function FindShipmentsPage() {
  usePageTitle("Tìm chuyến hàng");
  const { snapshot, logout } = useAuth();
  const shipment = getIllustrativeShipmentPreview();

  if (snapshot.status === "loading") {
    return (
      <div className="guest-frame py-10">
        <p className="text-sm text-muted">Đang kiểm tra phiên đăng nhập.</p>
      </div>
    );
  }

  if (snapshot.status === "authenticated" && snapshot.user.role === "CARRIER") {
    return <CarrierLoadBoard onLogout={() => void logout()} />;
  }

  return (
    <div className="guest-frame py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Tìm chuyến hàng</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink">
        Khách xem thẻ minh họa. Đây không phải đơn lạnh đang niêm yết và không nhận được chuyến.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        <Limit text="Xem được thẻ minh họa, không phải đơn lạnh đang niêm yết." />
        <Limit text="Không nhận chuyến, không gán xe và không gán tài xế." />
        <Limit text="Không mở hồ sơ doanh nghiệp, chứng từ, chat hay GPS." />
      </ul>
      <div className="mt-8 max-w-xl">
        <ShipmentPreviewCard shipment={shipment} presentation="plain" />
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
        Nhà xe đăng nhập để xem đơn Đang tìm xe và tự nhận chuyến. Thẻ minh họa không phải đơn thật.
      </p>
      <Link
        to={authPath("claim", paths.shipments)}
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"
      >
        Nhận chuyến với tài khoản Nhà xe
      </Link>
    </div>
  );
}

function Limit({ text }: { text: string }) {
  return <li className="rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink">{text}</li>;
}
