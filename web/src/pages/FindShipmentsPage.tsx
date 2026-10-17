import { Link } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { ShipmentPreviewCard } from "@/components/guest/ShipmentPreviewCard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getIllustrativeShipmentPreview } from "@/services/shipmentPreviewService";

export function FindShipmentsPage() {
  usePageTitle("Tìm chuyến hàng");
  const shipment = getIllustrativeShipmentPreview();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Tìm chuyến hàng</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink">
        Khách được xem thông tin công khai. Sàn đơn thật chưa nối với máy chủ, nên trang này chỉ hiển thị thẻ minh họa từ bản thiết kế.
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
        API niêm yết và tạo đơn đang chờ chốt. Khi có hợp đồng API, danh sách đơn trạng thái “Đang tìm xe” sẽ thay thế thẻ minh họa này.
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
