import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { compareDriverTrips, driverLane, type DriverLane } from "@/features/workspace/driver/driverLanes";
import { DriverTripCard } from "@/features/workspace/driver/DriverTripCard";
import { lostSession } from "@/features/workspace/sessionLoss";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { DriverShipment } from "@/models/publishedShipment";
import { listDriverShipments } from "@/services/shipmentService";

const filters: readonly { value: "" | DriverLane; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "pickup", label: "Chờ lấy hàng" },
  { value: "transit", label: "Đang vận chuyển" },
  { value: "delivered", label: "Đã giao" },
];

function laneParam(value: string | null): "" | DriverLane {
  if (value === "pickup" || value === "transit" || value === "delivered" || value === "other") return value;
  return "";
}

export function DriverTrips() {
  usePageTitle("Chuyến của tôi");
  const { logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const [shipments, setShipments] = useState<DriverShipment[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const lane = laneParam(params.get("nhom"));

  useEffect(() => {
    let active = true;
    listDriverShipments()
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
  }, [logout, reloadKey]);

  const needle = query.trim().toLowerCase();
  const shown = shipments
    .filter((shipment) => {
      if (lane !== "" && driverLane(shipment.status) !== lane) return false;
      if (needle.length === 0) return true;
      const haystack = [shipment.cargoDescription, shipment.pickupLocation, shipment.deliveryLocation, shipment.vehicleLabel, shipment.temperatureLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .sort(compareDriverTrips);

  return (
    <section className="space-y-6">
      <PageHeader title="Chuyến của tôi" summary="Chuyến nhà xe đã gán cho tài khoản này. Chờ lấy hàng và đang vận chuyển được xếp trước. Lọc không đổi trạng thái." />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải chuyến được phân công.</p> : null}
      {state === "error" ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-ink">Không tải được chuyến.</p>
          <Button
            type="button"
            className="mt-3"
            variant="outline"
            onClick={() => {
              setState("loading");
              setReloadKey((value) => value + 1);
            }}
          >
            Thử lại
          </Button>
        </div>
      ) : null}
      {state === "ready" && shipments.length === 0 ? (
        <EmptyPanel title="Chưa có chuyến được phân công" body="Khi nhà xe gán chuyến, chuyến sẽ hiện tại đây." />
      ) : null}
      {state === "ready" && shipments.length > 0 ? (
        <>
          <label className="block max-w-xl text-sm font-semibold text-ink" htmlFor="driver-trip-filter">
            Tìm theo hàng hóa, điểm lấy, điểm giao hoặc xe
            <Input id="driver-trip-filter" className="mt-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: thủy sản, Tiền Giang" />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo việc cần làm">
            {filters.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={lane === item.value}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${lane === item.value ? "bg-navy text-white" : "border border-line bg-surface text-ink"}`}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (item.value === "") next.delete("nhom");
                  else next.set("nhom", item.value);
                  setParams(next);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {shown.length} chuyến trong nhóm đang xem.
          </p>
          {shown.length === 0 ? <p className="text-sm text-ink">Không có chuyến khớp với bộ lọc vừa chọn.</p> : null}
          <ul className="grid gap-4 md:grid-cols-2">
            {shown.map((shipment) => (
              <li key={shipment.id}>
                <DriverTripCard shipment={shipment} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
