import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, summary, action }: { title: string; summary?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {summary ? <p className="mt-2 text-sm leading-relaxed text-muted">{summary}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ children, tone }: { children: ReactNode; tone: "open" | "waiting" | "assigned" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tone === "open" && "bg-canvas text-navy",
        tone === "waiting" && "bg-warning-bg text-warning",
        tone === "assigned" && "bg-success-bg text-success",
        tone === "neutral" && "bg-canvas text-ink",
      )}
    >
      {children}
    </span>
  );
}

export function MetricGrid({ items }: { items: readonly { label: string; value: number; hint: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-sm font-medium text-muted">{item.label}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-navy">{item.value}</p>
          <p className="mt-1 text-sm leading-snug text-ink">{item.hint}</p>
        </article>
      ))}
    </div>
  );
}

export function EmptyPanel({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div className="max-w-2xl">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
      {action ? <div className="mt-4 shrink-0 sm:mt-0">{action}</div> : null}
    </div>
  );
}

export function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-sm font-bold text-navy">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function FactLine({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted">{term}</dt>
      <dd className="text-sm font-semibold leading-relaxed text-ink">{value}</dd>
    </div>
  );
}
