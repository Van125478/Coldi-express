import { useEffect, useState } from "react";
import { getOilPrices, type OilBenchmarkView, type OilPricesResponse } from "@/services/oilPriceService";

type WidgetState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; body: OilPricesResponse };

const fallbackDisclaimer =
  "Giá dầu thô thế giới tham khảo, tính bằng USD/thùng. Không phải báo giá cước, không phải giá dầu diesel hoặc xăng bán lẻ tại Việt Nam, và không phải giá thời gian thực.";

function formatObserved(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatFetched(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function officialEiaUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname !== "www.eia.gov" && parsed.hostname !== "api.eia.gov") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function BenchmarkCard({ item, compact }: { item: OilBenchmarkView; compact: boolean }) {
  const source = officialEiaUrl(item.sourceUrl);
  return (
    <article className={`min-w-0 rounded-2xl border p-4 ${compact ? "border-line bg-white" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight">{item.label}</h3>
          <p className="text-xs text-muted">{item.benchmark === "BRENT" ? "Dầu thô Brent" : "Dầu thô WTI"}</p>
        </div>
        <p className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1e3a8a]">{item.freshnessLabel}</p>
      </div>
      <p className={`mt-4 font-extrabold tracking-tight ${compact ? "text-2xl" : "text-3xl"}`}>
        {item.priceUsdPerBarrel === null ? "—" : item.priceUsdPerBarrel}
        <span className="ml-2 text-sm font-semibold text-muted">USD/thùng</span>
      </p>
      <dl className="mt-4 space-y-1 text-sm leading-relaxed">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Ngày quan sát</dt>
          <dd className="font-semibold">{item.observedDate ? formatObserved(item.observedDate) : "—"}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">COLDI lấy dữ liệu</dt>
          <dd className="font-semibold">{item.fetchedAt ? formatFetched(item.fetchedAt) : "—"}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Nguồn</dt>
          <dd className="font-semibold">
            {source ? (
              <a className="underline-offset-4 hover:underline" href={source} target="_blank" rel="noreferrer">
                EIA
              </a>
            ) : (
              "EIA"
            )}
          </dd>
        </div>
      </dl>
      {item.warning ? <p className="mt-3 text-sm leading-relaxed text-muted">{item.warning}</p> : null}
    </article>
  );
}

export function WorldOilPriceWidget({ variant }: { variant: "landing" | "compact" | "embedded" }) {
  const compact = variant !== "landing";
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<WidgetState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    getOilPrices()
      .then((body) => {
        if (!active) return;
        if (!Array.isArray(body.benchmarks)) {
          setState({ kind: "error" });
          return;
        }
        setState({ kind: "ready", body });
      })
      .catch(() => {
        if (active) setState({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const heading = "Giá dầu thô thế giới";
  const shellClass =
    variant === "embedded"
      ? "text-ink"
      : compact
        ? "rounded-2xl border border-line bg-surface p-5 text-ink"
        : "border-t border-[#e2e8f0] bg-white text-[#1e293b]";
  const innerClass = variant === "landing" ? "guest-frame py-10 sm:py-12" : "";
  const benchmarks = state.kind === "ready" ? state.body.benchmarks : null;
  const disclaimer = state.kind === "ready" ? state.body.disclaimer : fallbackDisclaimer;

  return (
    <section className={shellClass} aria-labelledby={compact ? "world-oil-title-compact" : "world-oil-title"}>
      <div className={innerClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1e3a8a]">THAM KHẢO THỊ TRƯỜNG</p>
            <h2 id={compact ? "world-oil-title-compact" : "world-oil-title"} className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              {heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Brent và WTI, đơn vị USD/thùng. Số liệu không quyết định giá cước hoặc chi phí nhiên liệu của đội xe.</p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-xl border border-[#cbd5e1] px-4 text-sm font-semibold"
            onClick={() => {
              setState({ kind: "loading" });
              setReloadKey((value) => value + 1);
            }}
          >
            Tải lại
          </button>
        </div>
        {state.kind === "loading" ? (
          <p className="mt-5 text-sm text-muted" aria-live="polite">
            Đang tải giá dầu thô thế giới.
          </p>
        ) : null}
        {state.kind === "error" ? (
          <p className="mt-5 text-sm leading-relaxed" role="status">
            Chưa tải được giá dầu thế giới.
          </p>
        ) : null}
        {benchmarks ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {benchmarks.map((item) => (
              <BenchmarkCard key={item.benchmark} item={item} compact={compact} />
            ))}
          </div>
        ) : null}
        <p className="mt-4 text-sm leading-relaxed text-muted">{disclaimer}</p>
      </div>
    </section>
  );
}
