import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { ShipmentFacts } from "@/features/shipments/shipmentFacts";
import { primaryLinkClass, shipmentTone } from "@/features/workspace/format";
import { EmptyPanel, PageHeader, StatusBadge } from "@/features/workspace/ui";
import type { CarrierShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { claimShipment, listCarrierShipments } from "@/services/shipmentService";

export function CarrierLoadBoard() {
  usePageTitle("Tìm chuyến");
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
    <section className="space-y-6">
      <PageHeader title="Tìm chuyến hàng" summary="Nhà xe tự xem đơn đang tìm xe và tự nhận chuyến. Gọi điện hoặc nhắn tin không giữ chỗ. Nhận chuyến chưa gán xe hay tài xế." />
      {notice ? (
        <p role="status" className={`mt-6 max-w-3xl text-sm leading-relaxed ${noticeTone === "success" ? "text-success" : "text-ink"}`}>
          {notice}{" "}
          {noticeTone === "success" ? (
            <Link to={paths.carrierTrips} className="font-semibold text-navy underline-offset-4 hover:underline">
              Xem trong chuyến của tôi
            </Link>
          ) : null}
        </p>
      ) : null}
      {listState === "loading" ? <p className="mt-8 text-sm text-muted">Đang tải đơn đang tìm xe.</p> : null}
      {listState === "error" ? (
        <p role="alert" className="mt-8 text-sm text-ink">
          Không tải được danh sách đơn. Hãy tải lại trang.
        </p>
      ) : null}
      {listState === "ready" && shipments.length === 0 ? (
        <EmptyPanel
          title="Không có đơn đang tìm xe"
          body="Hiện không có đơn mở. Đơn mới hiện tại đây khi chủ hàng niêm yết."
          action={
            <Link to={paths.carrierHome} className={primaryLinkClass}>
              Về tổng quan
            </Link>
          }
        />
      ) : null}
      {listState === "ready" && shipments.length > 0 ? (
        <ul className="mt-8 grid gap-4 xl:grid-cols-2">
          {shipments.map((shipment) => (
            <li key={shipment.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-ink">
                  <Link to={`${paths.carrierHome}/chuyen/${shipment.id}`} className="hover:text-navy">
                    {shipment.cargoDescription}
                  </Link>
                </h2>
                <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
              </div>
              <ShipmentFacts shipment={shipment} />
              <Button className="mt-4" type="button" disabled={pendingId !== null} onClick={() => void claim(shipment.id)}>
                {pendingId === shipment.id ? "Đang nhận chuyến" : "Nhận chuyến"}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
