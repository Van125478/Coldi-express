import { Link } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { heroCopy, platformNames, trustItems } from "@/content/publicCopy";
import type { IconName } from "@/components/ui/Icon";
import { Icon } from "@/components/ui/Icon";
import { ColdChainScene } from "@/components/guest/ColdChainScene";
import { ShipmentPreviewCard } from "@/components/guest/ShipmentPreviewCard";
import { getIllustrativeShipmentPreview } from "@/services/shipmentPreviewService";

const platformIcon: Record<(typeof platformNames)[number], IconName> = {
  Windows: "windows",
  macOS: "laptop",
  Android: "android",
  iOS: "device",
};

export function HeroSection() {
  const shipment = getIllustrativeShipmentPreview();

  return (
    <section className="hero-dots" aria-labelledby="hero-title">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,34rem)] xl:py-16">
        <div className="min-w-0">
          <p className="motion-safe:animate-rise inline-flex items-center gap-2 rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#92400e]">
            <span className="grid size-5 place-items-center rounded-md bg-[#f59e0b] text-white">
              <Icon name="spark" className="size-3.5" />
            </span>
            {heroCopy.eyebrow}
          </p>
          <h1 id="hero-title" className="motion-safe:animate-rise motion-safe:[animation-delay:80ms] mt-5 text-[1.7rem] font-extrabold uppercase leading-[1.08] tracking-tight sm:text-5xl xl:text-[3.25rem]">
            <span className="block text-navy">{heroCopy.titleLead}</span>
            <span className="mt-1 block text-accent sm:whitespace-nowrap">{heroCopy.titleAccent}</span>
          </h1>
          <p className="motion-safe:animate-rise motion-safe:[animation-delay:160ms] mt-5 max-w-xl text-base leading-relaxed text-ink sm:text-lg">{heroCopy.lede}</p>
          <div className="motion-safe:animate-rise motion-safe:[animation-delay:240ms] mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to={paths.shipments}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep"
            >
              {heroCopy.primaryCta}
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link
              to={authPath("publish", paths.publish)}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-ink hover:border-navy hover:text-navy"
            >
              {heroCopy.secondaryCta}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className="font-medium text-ink">{heroCopy.platformLabel}</span>
            {platformNames.map((name) => (
              <Link key={name} to={paths.platform} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-ink hover:text-navy">
                <Icon name={platformIcon[name]} className="size-4" />
                {name}
              </Link>
            ))}
          </div>
          <Link to={paths.platform} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-navy">
            {heroCopy.downloadLabel}
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex -space-x-2" aria-hidden="true">
              {["#1e3a8a", "#047857", "#b45309", "#2563eb"].map((color) => (
                <span key={color} className="size-8 rounded-full border-2 border-white" style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="inline-flex items-center gap-1 text-success" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <Icon key={index} name="star" className="size-4" />
              ))}
            </span>
            <p className="text-sm leading-relaxed text-ink">
              <span className="font-bold">{heroCopy.ratingValue}</span>
              <span className="text-muted"> · {heroCopy.ratingCaption}</span>
            </p>
          </div>
          <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {trustItems.map((item) => (
              <li key={item.id} className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                <Icon name={item.icon} className="size-4 text-success" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <ShipmentPreviewCard
          shipment={shipment}
          presentation="browser"
          className="motion-safe:animate-rise motion-safe:[animation-delay:180ms]"
          lead={<ColdChainScene className="mb-4" />}
        />
      </div>
    </section>
  );
}
