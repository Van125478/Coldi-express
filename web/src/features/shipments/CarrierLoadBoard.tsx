import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CarrierShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { claimShipment, listCarrierShipments } from "@/services/shipmentService";

function money(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

export function CarrierLoadBoard({ onLogout }: { onLogout: () => void }) {
  const [shipments, setShipments] = useState<CarrierShipment[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "conflict" | "error">("success");

  const load = useCallback(async () => {
    try {
      const body = await listCarrierShipments();
      setShipments(body.shipments);
      setListState("ready");
    } catch {
      setListState("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    listCarrierShipments()
      .then((body) => {
        if (!active) return;
        setShipments(body.shipments);
        setListState("ready");
      })
      .catch(() => {
        if (active) setListState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function claim(id: string) {
    if (pendingId !== null) return;
    setPendingId(id);
    setNotice(null);
    try {
      const body = await claimShipment(id);
      setNoticeTone("success");
      setNotice(`Đã nhận chuyến. Trạng thái: ${body.shipment.statusLabel}. Chưa phân công xe và tài xế.`);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setNoticeTone("conflict");
        setNotice("Đơn này đã có nhà xe khác nhận. Chuyến không còn mở.");
        await load();
      } else {
        setNoticeTone("error");
        setNotice(caught instanceof ApiError ? caught.message : "Không nhận được chuyến. Hãy thử lại.");
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="guest-frame py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Tìm chuyến hàng</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink">
        Nhà xe tự xem đơn đang tìm xe và tự nhận chuyến. Gọi điện hoặc nhắn tin không giữ chỗ. Nhận chuyến chưa gán xe hay tài xế.
      </p>
      <div className="mt-6">
        <Button type="button" variant="outline" onClick={onLogout}>
          Đăng xuất
        </Button>
      </div>
      {notice ? (
        <p role="status" className={`mt-6 max-w-3xl text-sm leading-relaxed ${noticeTone === "success" ? "text-success" : "text-ink"}`}>
          {notice}
        </p>
      ) : null}
      {listState === "loading" ? <p className="mt-8 text-sm text-muted">Đang tải đơn đang tìm xe.</p> : null}
      {listState === "error" ? (
        <p role="alert" className="mt-8 text-sm text-ink">
          Không tải được danh sách đơn. Hãy tải lại trang.
        </p>
      ) : null}
      {listState === "ready" && shipments.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Chưa có đơn đang tìm xe.</p>
      ) : null}
      {listState === "ready" && shipments.length > 0 ? (
        <ul className="mt-8 grid max-w-3xl gap-4">
          {shipments.map((shipment) => (
            <li key={shipment.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-ink">{shipment.cargoDescription}</h2>
                <p className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-navy">{shipment.statusLabel}</p>
              </div>
              <p className="mt-3 text-sm text-muted">
                {shipment.pickupLocation} → {shipment.deliveryLocation}
              </p>
              <p className="mt-1 text-sm text-muted">
                {shipment.temperatureLabel} · {shipment.vehicleRequirement} · {money(shipment.listedPriceVnd)}
              </p>
              <Button className="mt-4" type="button" disabled={pendingId !== null} onClick={() => void claim(shipment.id)}>
                {pendingId === shipment.id ? "Đang nhận chuyến" : "Nhận chuyến"}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
