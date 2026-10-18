import { useEffect, useState, type ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { money, progressNote, shipmentTone, windowText } from "@/features/workspace/format";
import { EmptyPanel, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierDriver, CarrierShipment, CarrierVehicle } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { isAssignableDriver } from "@/features/auth/driverAccess";
import { assignShipment, listCarrierDrivers, listCarrierVehicles, listClaimedShipments } from "@/services/shipmentService";

export function ClaimedShipments() {
  usePageTitle("Chuyến của tôi");
  const [shipments, setShipments] = useState<CarrierShipment[]>([]);
  const [vehicles, setVehicles] = useState<CarrierVehicle[]>([]);
  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, { vehicleId: string; driverId: string }>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "conflict" | "error">("success");
  const [assignTarget, setAssignTarget] = useState<string | null>(null);

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
      setAssignTarget(null);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setNoticeTone("conflict");
        setNotice(
          caught.code === "vehicle_busy"
            ? caught.message
            : "Chuyến này đã được phân công. Không ghi đè phân công hiện có.",
        );
        setAssignTarget(null);
        await load();
      } else {
        setNoticeTone("error");
        setNotice(caught instanceof ApiError ? caught.message : "Không phân công được. Hãy thử lại.");
      }
    } finally {
      setPendingId(null);
    }
  }

  const location = useLocation();
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== "ARCHIVED");
  const resourcesReady = vehicles.length > 0 && drivers.length > 0;
  const targetShipment = shipments.find((item) => item.id === assignTarget) ?? null;
  const targetChoice = targetShipment ? choice(targetShipment.id) : null;
  const assignPreview =
    targetShipment && targetChoice
      ? {
          shipment: targetShipment,
          vehicle: vehicles.find((item) => item.id === targetChoice.vehicleId),
          driver: drivers.find((item) => item.id === targetChoice.driverId),
        }
      : null;
  const waiting = shipments.filter((item) => item.vehicleId === null || item.driverId === null);
  const awaitingPickup = shipments.filter((item) => item.status === "MATCHED" && item.vehicleId !== null && item.driverId !== null);
  const moving = shipments.filter((item) => item.status === "IN_TRANSIT");
  const delivered = shipments.filter((item) => item.status === "DELIVERY_CONFIRMED");
  const otherAssigned = shipments.filter(
    (item) => item.vehicleId !== null && item.driverId !== null && item.status !== "MATCHED" && item.status !== "IN_TRANSIT" && item.status !== "DELIVERY_CONFIRMED",
  );

  useEffect(() => {
    if (listState !== "ready" || !location.hash.startsWith("#phan-cong-")) return;
    const node = document.getElementById(location.hash.slice(1));
    if (!node) return;
    node.scrollIntoView({ block: "center" });
    const select = node.querySelector("select");
    if (select instanceof HTMLSelectElement) select.focus();
  }, [listState, location.hash]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Chuyến của tôi"
        summary="Chuyến đã nhận, xếp theo việc cần làm. Phân công xe và tài xế trước khi tài xế xác nhận lấy hàng."
      />
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
      {listState === "ready" && shipments.length === 0 ? (
        <EmptyPanel title="Chưa có chuyến đã nhận" body="Khi nhận một đơn đang tìm xe, chuyến sẽ hiện tại đây để phân công xe và tài xế." />
      ) : null}
      {listState === "ready" && shipments.length > 0 ? (
        <div className="space-y-8">
          {waiting.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-ink">Chờ phân công</h2>
              <ul className="grid gap-4">{waiting.map((shipment) => renderTrip(shipment))}</ul>
            </section>
          ) : null}
          <TripGroup title="Đã phân công, chờ lấy hàng" shipments={awaitingPickup} renderTrip={renderTrip} />
          <TripGroup title="Đang vận chuyển" shipments={moving} renderTrip={renderTrip} />
          <TripGroup title="Đã giao" shipments={delivered} renderTrip={renderTrip} />
          <TripGroup title="Đã phân công" shipments={otherAssigned} renderTrip={renderTrip} />
        </div>
      ) : null}
      {assignPreview ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1E293B]/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-confirm-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 outline-none"
            onKeyDown={(event) => {
              if (event.key === "Escape" && pendingId === null) setAssignTarget(null);
            }}
          >
            <h2 id="assign-confirm-title" className="text-lg font-bold text-ink">
              Xác nhận phân công
            </h2>
            <p className="mt-3 text-base font-semibold text-ink">
              {assignPreview.shipment.pickupLocation} → {assignPreview.shipment.deliveryLocation}
            </p>
            <p className="mt-1 text-sm text-muted">{assignPreview.shipment.cargoDescription}</p>
            <p className="mt-3 text-sm text-ink">{namedLine("Xe", vehicleText(assignPreview.vehicle))}</p>
            <p className="mt-1 text-sm text-ink">{namedLine("Tài xế", assignPreview.driver?.displayName ?? "Tài xế đã chọn")}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink">Phân công chưa phải xác nhận lấy hàng. Tài xế phải tự xác nhận khi đã nhận hàng.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={pendingId !== null} onClick={() => setAssignTarget(null)}>
                Hủy
              </Button>
              <Button type="button" disabled={pendingId !== null} onClick={() => void assign(assignPreview.shipment.id)}>
                {pendingId === assignPreview.shipment.id ? "Đang phân công" : "Xác nhận phân công"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );

  function vehicleText(vehicle: CarrierVehicle | undefined): string {
  if (!vehicle) return "Xe đã chọn";
  return vehicle.plate ? `${vehicle.label} · ${vehicle.plate}` : vehicle.label;
}

function namedLine(prefix: "Xe" | "Tài xế", value: string): string {
  const trimmed = value.trim();
  const lead = prefix.toLocaleLowerCase("vi");
  const folded = trimmed.toLocaleLowerCase("vi");
  if (folded === lead || folded.startsWith(`${lead} `)) return trimmed;
  return `${prefix}: ${trimmed}`;
}

function TripGroup({ title, shipments: items, renderTrip: render }: { title: string; shipments: CarrierShipment[]; renderTrip: (shipment: CarrierShipment) => ReactElement }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      <ul className="grid gap-4">{items.map((shipment) => render(shipment))}</ul>
    </section>
  );
}

function renderTrip(shipment: CarrierShipment) {
            const selected = choice(shipment.id);
            const assigned = shipment.vehicleId !== null && shipment.driverId !== null;
            return (
              <li id={`phan-cong-${shipment.id}`} key={shipment.id} className="scroll-mt-24 rounded-2xl border border-line bg-surface">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                  <div>
                    <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
                    <h3 className="mt-2 text-lg font-bold text-ink">
                      <Link to={`${paths.carrierHome}/chuyen/${shipment.id}`} className="hover:text-navy">
                        {shipment.pickupLocation} → {shipment.deliveryLocation}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted">{shipment.cargoDescription}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{money(shipment.listedPriceVnd)}</p>
                </div>
                <div className="grid gap-2 px-5 py-4 text-sm text-muted sm:grid-cols-3">
                  <p>{shipment.temperatureLabel} · {shipment.vehicleRequirement}</p>
                  <p>Lấy: {windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</p>
                  <p>Giao: {windowText(shipment.deliveryDate, shipment.deliveryTimeFrom, shipment.deliveryTimeTo)}</p>
                </div>
                {assigned ? (
                  <div className="grid gap-3 border-t border-line bg-canvas px-5 py-4 text-sm text-ink sm:grid-cols-2">
                    <p>{namedLine("Xe", shipment.vehicleLabel ?? "Xe đã phân công")}</p>
                    <p>{namedLine("Tài xế", shipment.driverName ?? "Tài xế đã phân công")}</p>
                    <p className="sm:col-span-2 text-muted">{progressNote(shipment.status)}</p>
                  </div>
                ) : (
                  <form
                    className="border-t border-line bg-canvas px-5 py-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (selected.vehicleId === "" || selected.driverId === "") return;
                      setAssignTarget(shipment.id);
                    }}
                  >
                    {resourcesReady ? null : (
                      <p className="mb-3 text-sm text-ink">Nhà xe chưa có xe hoặc tài xế để phân công.</p>
                    )}
                    {activeVehicles.length > 0 && activeVehicles.every((vehicle) => vehicle.availableForAssignment === false) ? (
                      <p className="mb-3 text-sm text-ink">Các xe đang gắn chuyến chưa hoàn thành. Hãy đợi chuyến kết thúc trước khi phân công thêm.</p>
                    ) : null}
                    <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div className="space-y-2">
                        <Label htmlFor={`${shipment.id}-vehicle`}>Xe</Label>
                        <select
                          id={`${shipment.id}-vehicle`}
                          className="flex h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50"
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
                          {activeVehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id} disabled={vehicle.availableForAssignment === false}>
                              {vehicleOptionLabel(vehicle)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${shipment.id}-driver`}>Tài xế</Label>
                        <select
                          id={`${shipment.id}-driver`}
                          className="flex h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50"
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
                          {drivers.filter(isAssignableDriver).map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.displayName ?? "Tài xế chưa có tên"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="submit"
                        className="h-12 w-full px-4 lg:w-auto"
                        disabled={pendingId !== null || !resourcesReady || selected.vehicleId === "" || selected.driverId === "" || !vehicleIsAvailable(vehicles.find((vehicle) => vehicle.id === selected.vehicleId))}
                      >
                        {pendingId === shipment.id ? "Đang phân công" : "Phân công xe và tài xế"}
                      </Button>
                    </div>
                  </form>
                )}
              </li>
    );
  }
}

function vehicleIsAvailable(vehicle: CarrierVehicle | undefined): boolean {
  return vehicle != null && vehicle.status !== "ARCHIVED" && vehicle.availableForAssignment !== false;
}

function vehicleOptionLabel(vehicle: CarrierVehicle): string {
  const name = vehicle.plate ? `${vehicle.label} · ${vehicle.plate}` : vehicle.label;
  return vehicle.availableForAssignment === false ? `${name} · Đang gắn chuyến` : name;
}
