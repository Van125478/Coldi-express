import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShipmentFacts } from "@/features/shipments/shipmentFacts";
import type { CarrierDriver, CarrierShipment, CarrierVehicle } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { assignShipment, listCarrierDrivers, listCarrierVehicles, listClaimedShipments } from "@/services/shipmentService";

export function ClaimedShipments() {
  const [shipments, setShipments] = useState<CarrierShipment[]>([]);
  const [vehicles, setVehicles] = useState<CarrierVehicle[]>([]);
  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, { vehicleId: string; driverId: string }>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "conflict" | "error">("success");

  async function load() {
    const [shipmentBody, vehicleBody, driverBody] = await Promise.all([
      listClaimedShipments(),
      listCarrierVehicles(),
      listCarrierDrivers(),
    ]);
    setShipments(shipmentBody.shipments);
    setVehicles(vehicleBody.vehicles);
    setDrivers(driverBody.drivers);
    setListState("ready");
  }

  useEffect(() => {
    let active = true;
    Promise.all([listClaimedShipments(), listCarrierVehicles(), listCarrierDrivers()])
      .then(([shipmentBody, vehicleBody, driverBody]) => {
        if (!active) return;
        setShipments(shipmentBody.shipments);
        setVehicles(vehicleBody.vehicles);
        setDrivers(driverBody.drivers);
        setListState("ready");
      })
      .catch(() => {
        if (active) setListState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  function choice(id: string) {
    return choices[id] ?? { vehicleId: "", driverId: "" };
  }

  async function assign(id: string) {
    const selected = choice(id);
    if (pendingId !== null || selected.vehicleId === "" || selected.driverId === "") return;
    setPendingId(id);
    setNotice(null);
    try {
      const body = await assignShipment(id, selected);
      setNoticeTone("success");
      setNotice(`Đã phân công. Trạng thái vận hành: ${body.shipment.statusLabel}. Chưa xác nhận lấy hàng.`);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setNoticeTone("conflict");
        setNotice("Chuyến này đã được phân công. Không ghi đè phân công hiện có.");
        await load();
      } else {
        setNoticeTone("error");
        setNotice(caught instanceof ApiError ? caught.message : "Không phân công được. Hãy thử lại.");
      }
    } finally {
      setPendingId(null);
    }
  }

  const resourcesReady = vehicles.length > 0 && drivers.length > 0;

  return (
    <div>
      {notice ? (
        <p role="status" className={`mt-6 max-w-3xl text-sm leading-relaxed ${noticeTone === "success" ? "text-success" : "text-ink"}`}>
          {notice}
        </p>
      ) : null}
      {listState === "loading" ? <p className="mt-8 text-sm text-muted">Đang tải chuyến đã nhận.</p> : null}
      {listState === "error" ? (
        <p role="alert" className="mt-8 text-sm text-ink">
          Không tải được chuyến đã nhận. Hãy tải lại trang.
        </p>
      ) : null}
      {listState === "ready" && shipments.length === 0 ? <p className="mt-8 text-sm text-muted">Chưa có chuyến đã nhận.</p> : null}
      {listState === "ready" && shipments.length > 0 ? (
        <ul className="mt-8 grid max-w-5xl gap-4">
          {shipments.map((shipment) => {
            const selected = choice(shipment.id);
            const assigned = shipment.vehicleId !== null && shipment.driverId !== null;
            return (
              <li key={shipment.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-ink">{shipment.cargoDescription}</h2>
                  <p className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-navy">{shipment.statusLabel}</p>
                </div>
                <ShipmentFacts shipment={shipment} />
                {assigned ? (
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    Xe: {shipment.vehicleLabel ?? "Xe đã phân công"}. Tài xế: {shipment.driverName ?? "Tài xế đã phân công"}. Chưa xác nhận lấy hàng.
                  </p>
                ) : (
                  <form
                    className="mt-4 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void assign(shipment.id);
                    }}
                  >
                    {resourcesReady ? null : (
                      <p className="text-sm text-ink">Nhà xe chưa có xe hoặc tài xế để phân công.</p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor={`${shipment.id}-vehicle`}>Xe</Label>
                      <select
                        id={`${shipment.id}-vehicle`}
                        className="flex h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink disabled:opacity-50"
                        value={selected.vehicleId}
                        disabled={pendingId !== null || !resourcesReady}
                        onChange={(event) =>
                          setChoices((current) => ({
                            ...current,
                            [shipment.id]: { vehicleId: event.target.value, driverId: selected.driverId },
                          }))
                        }
                      >
                        <option value="">Chọn xe</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${shipment.id}-driver`}>Tài xế</Label>
                      <select
                        id={`${shipment.id}-driver`}
                        className="flex h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink disabled:opacity-50"
                        value={selected.driverId}
                        disabled={pendingId !== null || !resourcesReady}
                        onChange={(event) =>
                          setChoices((current) => ({
                            ...current,
                            [shipment.id]: { vehicleId: selected.vehicleId, driverId: event.target.value },
                          }))
                        }
                      >
                        <option value="">Chọn tài xế</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.displayName ?? "Tài xế chưa có tên"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" disabled={pendingId !== null || !resourcesReady || selected.vehicleId === "" || selected.driverId === ""}>
                      {pendingId === shipment.id ? "Đang phân công" : "Phân công xe và tài xế"}
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
