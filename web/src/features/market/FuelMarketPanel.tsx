import { useEffect, useState } from "react";
import { WorldOilPriceWidget } from "@/features/market/WorldOilPriceWidget";
import { formatVietnamWhen, formatVndPerLitre, getFuelMarket, type DieselView } from "@/services/fuelMarketService";

type PanelState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; diesel: DieselView };

function officialUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    if (host !== "moit.gov.vn" && host !== "www.moit.gov.vn" && host !== "minhbach.moit.gov.vn") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function DieselCard({ diesel, compact }: { diesel: DieselView; compact: boolean }) {
  const source = officialUrl(diesel.sourceUrl ?? diesel.latestKnownDocument.sourceUrl);
  const index = officialUrl(diesel.officialIndexUrl);
  return (
    <article className={`rounded-2xl border p-4 ${compact ? "border-line bg-white" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight">{diesel.productLabel}</h3>
          <p className="text-xs text-muted">{diesel.priceKindLabel ?? "Chưa có giá đã xác minh"}</p>
        </div>
        <p className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1e3a8a]">{diesel.available ? "Đã xác minh" : "Chưa xác minh"}</p>
      </div>
      <p className={`mt-4 font-extrabold tracking-tight ${compact ? "text-2xl" : "text-3xl"}`}>
        {diesel.available ? formatVndPerLitre(diesel.priceVndPerLitre) : diesel.message}
      </p>
      <dl className="mt-4 space-y-1 text-sm leading-relaxed">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Văn bản</dt>
          <dd className="font-semibold">{diesel.documentNumber ?? diesel.latestKnownDocument.number}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Ngày công bố</dt>
          <dd className="font-semibold">{formatVietnamWhen(diesel.announcedOn ?? diesel.latestKnownDocument.announcedOn)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Xác minh lần cuối</dt>
          <dd className="font-semibold">{formatVietnamWhen(diesel.verifiedAt)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Nguồn</dt>
          <dd className="font-semibold">
            {source ? (
              <a className="underline-offset-4 hover:underline" href={source} target="_blank" rel="noreferrer">
                Bộ Công Thương
              </a>
            ) : (
              "Bộ Công Thương"
            )}
            {index ? (
              <>
                <span aria-hidden="true"> · </span>
                <a className="underline-offset-4 hover:underline" href={index} target="_blank" rel="noreferrer">
                  Minh bạch xăng dầu
                </a>
              </>
            ) : null}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-muted">{diesel.available ? diesel.disclaimer : diesel.latestKnownDocument.note}</p>
    </article>
  );
}

export function FuelMarketPanel({ variant }: { variant: "landing" | "compact" | "page" }) {
  const compact = variant !== "landing";
  const [state, setState] = useState<PanelState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    getFuelMarket()
      .then((body) => {
        if (!active) return;
        if (!body.diesel) {
          setState({ kind: "error" });
          return;
        }
        setState({ kind: "ready", diesel: body.diesel });
      })
      .catch(() => {
        if (active) setState({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, []);

  const shellClass =
    variant === "landing"
      ? "border-t border-[#e2e8f0] bg-white text-[#1e293b]"
      : "rounded-2xl border border-line bg-surface p-5 text-ink";
  const innerClass = variant === "landing" ? "guest-frame py-10 sm:py-12" : "space-y-5";

  return (
    <section className={shellClass} aria-labelledby={variant === "landing" ? "fuel-market-title" : "fuel-market-title-compact"}>
      <div className={innerClass}>
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1e3a8a]">THAM KHẢO THỊ TRƯỜNG</p>
          <h2 id={variant === "landing" ? "fuel-market-title" : "fuel-market-title-compact"} className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            Thị trường nhiên liệu
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Diesel Việt Nam tính bằng đồng/lít. Brent và WTI tính bằng USD/thùng. Số liệu không đổi giá cước, gói dịch vụ hoặc hoa hồng.
          </p>
        </div>
        {state.kind === "loading" ? (
          <p className="mt-5 text-sm text-muted" aria-live="polite">
            Đang tải thị trường nhiên liệu.
          </p>
        ) : null}
        {state.kind === "error" ? (
          <p className="mt-5 text-sm leading-relaxed" role="status">
            Chưa có dữ liệu diesel được xác minh
          </p>
        ) : null}
        {state.kind === "ready" ? (
          <div className="mt-5">
            <DieselCard diesel={state.diesel} compact={compact} />
          </div>
        ) : null}
        <div className={variant === "landing" ? "mt-8" : "mt-5"}>
          <WorldOilPriceWidget variant="embedded" />
        </div>
      </div>
    </section>
  );
}
