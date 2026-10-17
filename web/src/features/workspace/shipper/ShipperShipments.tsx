import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/useAuth";
import { lostSession } from "@/features/workspace/sessionLoss";
import { primaryLinkClass } from "@/features/workspace/format";
import { shipperBucket, type ShipperBucket } from "@/features/workspace/shipper/shipperGroups";
import { ShipperShipmentCard } from "@/features/workspace/shipper/ShipperShipmentCard";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { PublishedShipment } from "@/models/publishedShipment";
import { listMyShipments } from "@/services/shipmentService";

const filters: readonly { value: "" | ShipperBucket; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "published", label: "Đang tìm xe" },
  { value: "matched", label: "Đã nhận" },
  { value: "transit", label: "Đang chạy" },
  { value: "delivered", label: "Đã giao" },
];

function bucketParam(value: string | null): "" | ShipperBucket {
  if (value === "published" || value === "matched" || value === "transit" || value === "delivered" || value === "other") return value;
  return "";
}

export function ShipperShipments() {
  usePageTitle("Quản lý đơn");
  const { logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const [shipments, setShipments] = useState<PublishedShipment[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const bucket = bucketParam(params.get("trang"));

  useEffect(() => {
    let active = true;
    listMyShipments()
      .then((body) => {
        if (!active) return;
        setShipments(body.shipments);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [logout]);

  const needle = query.trim().toLowerCase();
  const shown = shipments.filter((shipment) => {
    if (bucket !== "" && shipperBucket(shipment.status) !== bucket) return false;
    if (needle.length === 0) return true;
    const haystack = [shipment.cargoDescription, shipment.pickupLocation, shipment.deliveryLocation, shipment.pickupCompany, shipment.deliveryCompany]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Quản lý đơn hàng"
        summary="Đơn đã niêm yết của tài khoản này. Lọc chạy trên danh sách vừa tải và không đổi trạng thái."
        action={
          <Link to={paths.shipperCreate} className={primaryLinkClass}>
            Đăng đơn hàng
          </Link>
        }
      />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải đơn.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được danh sách đơn. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" && shipments.length === 0 ? (
        <EmptyPanel
          title="Chưa có đơn"
          body="Đơn niêm yết sẽ hiện tại đây."
          action={
            <Link to={paths.shipperCreate} className={primaryLinkClass}>
              Đăng đơn hàng
            </Link>
          }
        />
      ) : null}
      {state === "ready" && shipments.length > 0 ? (
        <>
          <label className="block max-w-xl text-sm font-semibold text-ink" htmlFor="shipment-filter">
            Tìm theo hàng hóa, điểm lấy hoặc điểm giao
            <Input id="shipment-filter" className="mt-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: thủy sản, Cái Bè" />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
            {filters.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={bucket === item.value}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${bucket === item.value ? "bg-navy text-white" : "border border-line bg-surface text-ink"}`}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (item.value === "") next.delete("trang");
                  else next.set("trang", item.value);
                  setParams(next);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {shown.length} đơn trong nhóm đang xem.
          </p>
          {shown.length === 0 ? <p className="text-sm text-ink">Không có đơn khớp với bộ lọc vừa chọn.</p> : null}
          <ul className="grid gap-4 md:grid-cols-2">
            {shown.map((shipment) => (
              <li key={shipment.id}>
                <ShipperShipmentCard shipment={shipment} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
