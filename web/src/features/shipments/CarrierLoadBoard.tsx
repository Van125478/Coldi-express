import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { ClaimConfirm } from "@/features/shipments/ClaimConfirm";
import { emptyMarketplaceForm, formFromParams, searchFromForm, type MarketplaceForm } from "@/features/shipments/marketplaceForm";
import { lostSession } from "@/features/workspace/sessionLoss";
import { money, primaryLinkClass, shipmentTone, windowText } from "@/features/workspace/format";
import { EmptyPanel, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CarrierShipment } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { claimShipment, listCarrierShipments } from "@/services/shipmentService";

export function CarrierLoadBoard() {
  usePageTitle("Tìm chuyến");
  const { logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState<MarketplaceForm>(() => formFromParams(params));
  const [shipments, setShipments] = useState<CarrierShipment[]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [formError, setFormError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareNote, setCompareNote] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "conflict" | "error">("success");
  const [reloadKey, setReloadKey] = useState(0);
  const query = params.toString();
  const requestQuery = new URLSearchParams(query);
  if (!requestQuery.has("sort")) requestQuery.set("sort", "newest");
  const boardQuery = requestQuery.toString();

  useEffect(() => {
    let active = true;
    listCarrierShipments(boardQuery)
      .then((body) => {
        if (!active) return;
        setShipments(body.shipments);
        setTotal(body.total ?? body.shipments.length);
        setTruncated(body.truncated === true);
        setListState("ready");
        setSelected((current) => current.filter((id) => body.shipments.some((item) => item.id === id)));
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setListState("error");
      });
    return () => {
      active = false;
    };
  }, [logout, boardQuery, reloadKey]);

  function apply(next: MarketplaceForm) {
    try {
      setFormError(null);
      setParams(new URLSearchParams(searchFromForm(next)));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Bộ lọc không hợp lệ.");
    }
  }

  function toggleCompare(id: string) {
    setCompareNote(null);
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) {
        setCompareNote("Chỉ so sánh hai chuyến cùng lúc. Bỏ một chuyến đã chọn trước.");
        return current;
      }
      return [...current, id];
    });
  }

  async function confirmClaim() {
    if (!confirmId || pendingId !== null) return;
    const id = confirmId;
    setPendingId(id);
    setNotice(null);
    try {
      const body = await claimShipment(id);
      setNoticeTone("success");
      setNotice(`Đã nhận chuyến. Trạng thái: ${body.shipment.statusLabel}. Chưa phân công xe và tài xế.`);
      setConfirmId(null);
      const refreshed = await listCarrierShipments(boardQuery);
      setShipments(refreshed.shipments);
      setTotal(refreshed.total ?? refreshed.shipments.length);
      setSelected((current) => current.filter((item) => item !== id));
    } catch (caught) {
      if (lostSession(caught, logout)) return;
      if (caught instanceof ApiError && caught.status === 409) {
        setNoticeTone("conflict");
        setNotice("Đơn này đã có nhà xe khác nhận. Chuyến không còn mở.");
        setConfirmId(null);
        const refreshed = await listCarrierShipments(boardQuery);
        setShipments(refreshed.shipments);
        setTotal(refreshed.total ?? refreshed.shipments.length);
      } else {
        setNoticeTone("error");
        setNotice(caught instanceof ApiError ? caught.message : "Không nhận được chuyến. Hãy thử lại.");
      }
    } finally {
      setPendingId(null);
    }
  }

  const confirming = shipments.find((item) => item.id === confirmId) ?? null;
  const compared = selected.map((id) => shipments.find((item) => item.id === id)).filter((item): item is CarrierShipment => item !== undefined);
  const filtersActive = Array.from(params.keys()).some((key) => key !== "sort");

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tìm chuyến hàng"
        summary="Nhà xe tự xem đơn đang tìm xe, lọc và so sánh, rồi tự nhận chuyến. Gọi điện, nhắn tin hoặc chọn so sánh không giữ chỗ."
      />
      <form
        className="space-y-4 rounded-2xl border border-line bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          apply(form);
        }}
      >
        <div>
          <Label htmlFor="marketplace-q">Tìm theo hàng, điểm lấy hoặc điểm giao</Label>
          <Input
            id="marketplace-q"
            value={form.q}
            onChange={(event) => setForm({ ...form, q: event.target.value })}
            placeholder="Ví dụ: thủy sản, Cái Bè, Thủ Đức"
            className="mt-2"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="marketplace-temperature">Nhóm nhiệt độ</Label>
            <select
              id="marketplace-temperature"
              value={form.temperature}
              onChange={(event) => setForm({ ...form, temperature: event.target.value as MarketplaceForm["temperature"] })}
              className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
            >
              <option value="">Tất cả</option>
              <option value="COOL">Lạnh mát</option>
              <option value="FROZEN">Đông</option>
              <option value="DEEP_FROZEN">Cực lạnh</option>
            </select>
          </div>
          <div>
            <Label htmlFor="marketplace-pickup">Điểm lấy chứa</Label>
            <Input id="marketplace-pickup" value={form.pickup} onChange={(event) => setForm({ ...form, pickup: event.target.value })} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="marketplace-delivery">Điểm giao chứa</Label>
            <Input id="marketplace-delivery" value={form.delivery} onChange={(event) => setForm({ ...form, delivery: event.target.value })} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="marketplace-sort">Sắp xếp</Label>
            <select
              id="marketplace-sort"
              value={form.sort}
              onChange={(event) => setForm({ ...form, sort: event.target.value as MarketplaceForm["sort"] })}
              className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
            >
              <option value="newest">Mới đăng</option>
              <option value="pickup">Thời gian lấy hàng</option>
              <option value="price">Giá cước niêm yết, thấp đến cao</option>
              <option value="weight">Tải trọng, nặng đến nhẹ</option>
            </select>
          </div>
          <div>
            <Label htmlFor="marketplace-weight-min">Tải trọng từ (tấn)</Label>
            <Input id="marketplace-weight-min" inputMode="decimal" value={form.weightMin} onChange={(event) => setForm({ ...form, weightMin: event.target.value })} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="marketplace-weight-max">Tải trọng đến (tấn)</Label>
            <Input id="marketplace-weight-max" inputMode="decimal" value={form.weightMax} onChange={(event) => setForm({ ...form, weightMax: event.target.value })} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="marketplace-from">Lấy hàng từ ngày</Label>
            <Input id="marketplace-from" type="date" value={form.pickupFrom} onChange={(event) => setForm({ ...form, pickupFrom: event.target.value })} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="marketplace-to">Lấy hàng đến ngày</Label>
            <Input id="marketplace-to" type="date" value={form.pickupTo} onChange={(event) => setForm({ ...form, pickupTo: event.target.value })} className="mt-2" />
          </div>
        </div>
        {formError ? (
          <p role="alert" className="text-sm text-ink">
            {formError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Áp dụng</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setForm(emptyMarketplaceForm);
              setFormError(null);
              setParams(new URLSearchParams());
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </form>
      {notice ? (
        <p role="status" className={`text-sm leading-relaxed ${noticeTone === "success" ? "text-success" : "text-ink"}`}>
          {notice}{" "}
          {noticeTone === "success" ? (
            <Link to={paths.carrierTrips} className="font-semibold text-navy underline-offset-4 hover:underline">
              Tiếp tục phân công trong chuyến của tôi
            </Link>
          ) : null}
        </p>
      ) : null}
      {listState === "loading" ? <p className="text-sm text-muted">Đang tải đơn đang tìm xe.</p> : null}
      {listState === "error" ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-ink">Không tải được danh sách đơn.</p>
          <Button type="button" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      ) : null}
      {listState === "ready" ? (
        <p className="text-sm text-muted" aria-live="polite">
          {total} chuyến phù hợp{truncated ? ". Danh sách đang giới hạn 500 đơn đầu để lọc." : ""}.
        </p>
      ) : null}
      {listState === "ready" && shipments.length === 0 ? (
        <EmptyPanel
          title={filtersActive ? "Không có chuyến khớp bộ lọc" : "Không có đơn đang tìm xe"}
          body={filtersActive ? "Thử xóa bớt điều kiện. Bộ lọc không tự ghép nhà xe với chuyến." : "Hiện không có đơn mở. Đơn mới hiện tại đây khi chủ hàng niêm yết."}
          action={
            filtersActive ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(emptyMarketplaceForm);
                  setParams(new URLSearchParams());
                }}
              >
                Xóa bộ lọc
              </Button>
            ) : (
              <Link to={paths.carrierHome} className={primaryLinkClass}>
                Về tổng quan
              </Link>
            )
          }
        />
      ) : null}
      {listState === "ready" && shipments.length > 0 ? (
        <ul className="grid gap-4 xl:grid-cols-2">
          {shipments.map((shipment) => (
            <li key={shipment.id}>
              <ShipmentCard
                shipment={shipment}
                selected={selected.includes(shipment.id)}
                pending={pendingId !== null}
                onClaim={() => setConfirmId(shipment.id)}
                onCompare={() => toggleCompare(shipment.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {compared.length > 0 ? <ComparisonPanel shipments={compared} note={compareNote} onClear={() => setSelected([])} /> : null}
      <ClaimConfirm
        open={confirming !== null}
        pending={pendingId !== null}
        cargo={confirming?.cargoDescription ?? ""}
        route={confirming ? `${confirming.pickupLocation} → ${confirming.deliveryLocation}` : ""}
        onCancel={() => {
          if (pendingId === null) setConfirmId(null);
        }}
        onConfirm={() => void confirmClaim()}
      />
    </section>
  );
}

function ShipmentCard({
  shipment,
  selected,
  pending,
  onClaim,
  onCompare,
}: {
  shipment: CarrierShipment;
  selected: boolean;
  pending: boolean;
  onClaim: () => void;
  onCompare: () => void;
}) {
  const weight = shipment.cargoWeightTon === null ? "Chưa có tải trọng" : `${shipment.cargoWeightTon} tấn`;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold leading-snug text-ink">
          <Link to={`${paths.carrierHome}/chuyen/${shipment.id}`} className="hover:text-navy">
            {shipment.cargoDescription}
          </Link>
        </h2>
        <StatusBadge tone={shipmentTone(shipment.status, shipment.vehicleId, shipment.driverId)}>{shipment.statusLabel}</StatusBadge>
      </div>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-ink">
        {shipment.pickupLocation} → {shipment.deliveryLocation}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {shipment.temperatureLabel} · {weight} · {shipment.vehicleRequirement}
      </p>
      <p className="mt-1 text-sm text-muted">Lấy hàng: {windowText(shipment.pickupDate, shipment.pickupTimeFrom, shipment.pickupTimeTo)}</p>
      <p className="mt-3 text-xl font-extrabold text-navy">{money(shipment.listedPriceVnd)}</p>
      <p className="text-xs text-muted">Cước niêm yết</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={onClaim}>
          Nhận chuyến
        </Button>
        <Link to={`${paths.carrierHome}/chuyen/${shipment.id}`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-navy underline-offset-4 hover:underline">
          Xem chi tiết
        </Link>
        {shipment.pickupPhone ? (
          <a href={`tel:${shipment.pickupPhone}`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Gọi
          </a>
        ) : null}
        <Link to={`${paths.carrierHome}/chuyen/${shipment.id}#tro-chuyen`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-navy underline-offset-4 hover:underline">
          Nhắn chủ hàng
        </Link>
        <Button type="button" variant={selected ? "default" : "outline"} aria-pressed={selected} onClick={onCompare}>
          {selected ? "Đang so sánh" : "So sánh"}
        </Button>
      </div>
    </article>
  );
}

function ComparisonPanel({ shipments, note, onClear }: { shipments: CarrierShipment[]; note: string | null; onClear: () => void }) {
  const fields = [
    { label: "Tuyến", value: (item: CarrierShipment) => `${item.pickupLocation} → ${item.deliveryLocation}` },
    { label: "Hàng", value: (item: CarrierShipment) => item.cargoDescription },
    { label: "Nhiệt độ", value: (item: CarrierShipment) => item.temperatureLabel },
    { label: "Tải trọng", value: (item: CarrierShipment) => (item.cargoWeightTon === null ? "Chưa có" : `${item.cargoWeightTon} tấn`) },
    { label: "Lịch lấy", value: (item: CarrierShipment) => windowText(item.pickupDate, item.pickupTimeFrom, item.pickupTimeTo) },
    { label: "Xe yêu cầu", value: (item: CarrierShipment) => item.vehicleRequirement },
    { label: "Cước niêm yết", value: (item: CarrierShipment) => money(item.listedPriceVnd) },
  ];
  return (
    <section className="rounded-2xl border border-line bg-surface p-4" aria-labelledby="compare-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="compare-title" className="text-base font-bold text-ink">
          So sánh tạm
        </h2>
        <Button type="button" variant="outline" onClick={onClear}>
          Bỏ chọn
        </Button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">Chỉ giữ trên trình duyệt này cho đến khi tải lại trang. Không lưu tài khoản và không giữ chỗ.</p>
      {note ? <p className="mt-2 text-sm text-ink">{note}</p> : null}
      {shipments.length < 2 ? <p className="mt-3 text-sm text-ink">Chọn thêm một chuyến để đặt cạnh nhau.</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {shipments.map((item) => (
          <article key={item.id} className="rounded-xl border border-line p-3">
            <h3 className="font-semibold text-ink">{item.cargoDescription}</h3>
            <dl className="mt-2 space-y-1">
              {fields.map((field) => (
                <div key={field.label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2 text-sm">
                  <dt className="text-muted">{field.label}</dt>
                  <dd className="text-ink">{field.value(item)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
