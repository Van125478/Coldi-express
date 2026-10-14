import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { authPath } from "@/app/paths";
import { cn } from "@/lib/cn";
import type { ShipmentPreview, ShipmentStop } from "@/models/shipment";
import { Icon } from "@/components/ui/Icon";

type ShipmentPreviewCardProps = {
  shipment: ShipmentPreview;
  presentation: "browser" | "plain";
  lead?: ReactNode;
  className?: string;
};

const claimPath = authPath("claim", "/tim-chuyen-hang");

export function ShipmentPreviewCard({ shipment, presentation, lead, className }: ShipmentPreviewCardProps) {
  const noteId = `claim-preview-note-${presentation}`;
  const card = (
    <article
      className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5"
      aria-label="Minh họa thẻ vận chuyển, không phải đơn đang mở trên sàn"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-bold leading-snug text-ink sm:text-xl">
          {shipment.origin}
          <span className="mx-1.5 text-accent" aria-hidden="true">
            →
          </span>
          {shipment.destination}
        </h2>
        <div className="sm:text-right">
          <p className="text-sm font-semibold text-success">{shipment.readyTrucksLabel}</p>
          <p className="mt-1 inline-flex rounded-full border border-success-line bg-success-bg px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-success">
            {shipment.boardStatusLabel}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{shipment.distanceLabel}</p>
      <dl className="mt-4 grid grid-cols-1 gap-3 border-y border-line py-4 min-[420px]:grid-cols-3">
        <Fact label="Loại hàng" value={shipment.cargoType} />
        <Fact label="Tải trọng" value={shipment.weightLabel} />
        <Fact label="Yêu cầu xe" value={shipment.vehicleRequirement} />
      </dl>
      <ol className="mt-4 space-y-4">
        <Stop stop={shipment.pickup} markerClass="bg-navy" />
        <Stop stop={shipment.dropoff} markerClass="bg-success" />
      </ol>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5 rounded-full bg-success-bg px-3 py-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-white">
            <Icon name="check" className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{shipment.recentActivity.name}</span>
            <span className="block text-xs leading-relaxed text-muted">{shipment.recentActivity.detail}</span>
          </span>
        </div>
        <Link
          to={claimPath}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"
          aria-describedby={noteId}
        >
          Nhận chuyến ngay
        </Link>
      </div>
    </article>
  );

  return (
    <figure className={cn("min-w-0", className)}>
      {presentation === "browser" ? (
        <BrowserFrame>
          {lead}
          {card}
        </BrowserFrame>
      ) : (
        card
      )}
      <figcaption id={noteId} className="mt-3 text-sm leading-relaxed text-muted">
        Khung minh họa theo bản thiết kế. Bấm Nhận chuyến ngay chỉ mở yêu cầu đăng nhập, không gửi yêu cầu nhận chuyến.
      </figcaption>
    </figure>
  );
}

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(30,58,138,0.55)]">
      <div className="flex items-center gap-3 border-b border-line bg-[#f8fafc] px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#fda4af]" />
          <span className="size-2.5 rounded-full bg-[#fcd34d]" />
          <span className="size-2.5 rounded-full bg-[#86efac]" />
        </span>
        <p className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted">
          <Icon name="lock" className="size-3.5 shrink-0" />
          <span className="truncate">https://coldi.vn/tim-chuyen-hang</span>
        </p>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-snug text-ink">{value}</dd>
    </div>
  );
}

function Stop({ stop, markerClass }: { stop: ShipmentStop; markerClass: string }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${markerClass}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-ink">{stop.title}</p>
          <p className="text-sm leading-relaxed text-muted">{stop.note}</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-ink sm:text-right">{stop.timeLabel}</p>
      </div>
    </li>
  );
}
