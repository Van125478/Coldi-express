import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { carrierVehicleEditPath, paths } from "@/app/paths";
import { DetailBlock, FactLine, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierVehicle } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { getCarrierVehicle } from "@/services/shipmentService";

export function CarrierVehicleDetail() {
  usePageTitle("Chi tiết xe");
  const { id } = useParams();
  const location = useLocation();
  const saved = Boolean((location.state as { saved?: boolean } | null)?.saved);
  const [vehicle, setVehicle] = useState<CarrierVehicle | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCarrierVehicle(id)
      .then((body) => {
        if (!active) return;
        setVehicle(body.vehicle);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState(error instanceof ApiError && error.status === 404 ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <section className="max-w-2xl space-y-6">
      <Link to={paths.carrierFleet} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Danh sách xe
      </Link>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải xe.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy xe này trong đội xe của bạn.</p> : null}
      {state === "error" ? <p className="text-sm text-ink">Không tải được xe.</p> : null}
      {state === "ready" && vehicle ? (
        <>
          <PageHeader
            title={vehicle.label}
            summary={vehicle.plate ?? "Chưa có biển số"}
            action={
              <Link to={carrierVehicleEditPath(vehicle.id)} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold text-navy">
                Chỉnh sửa xe
              </Link>
            }
          />
          {saved ? <p className="text-sm font-semibold text-success">Đã lưu xe.</p> : null}
          <DetailBlock title="Thông tin xe">
            <FactLine term="Tên xe" value={vehicle.label} />
            <FactLine term="Biển số" value={vehicle.plate ?? "Chưa có"} />
            <FactLine term="Loại" value={vehicle.vehicleKindLabel ?? "Chưa có"} />
            <FactLine term="Nhóm nhiệt" value={vehicle.temperatureLabel ?? "Chưa có"} />
            <FactLine term="Tải trọng" value={vehicle.capacityTon == null ? "Chưa có" : `${vehicle.capacityTon} tấn`} />
          </DetailBlock>
          <p className="text-sm leading-relaxed text-muted">Thông tin này không chứng nhận đăng kiểm, bảo dưỡng hay tình trạng máy lạnh. Xe có thể được chọn khi phân công sau khi nhận chuyến.</p>
        </>
      ) : null}
    </section>
  );
}
