import { designPresentationNote, proofPoints } from "@/content/publicCopy";
import { cn } from "@/lib/cn";

export function ProofStrip() {
  return (
    <section className="border-t border-line bg-surface" aria-labelledby="proof-title">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <h2 id="proof-title" className="sr-only">
          Số liệu trình bày trên bản thiết kế
        </h2>
        <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {proofPoints.map((point) => (
            <li key={point.id} className="min-w-0">
              <p className={cn("text-3xl font-extrabold tracking-tight sm:text-4xl", point.tone === "success" ? "text-success" : "text-navy")}>
                {point.value}
              </p>
              <p className="mt-2 text-sm font-bold text-ink">{point.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{point.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-3xl text-sm leading-relaxed text-muted">{designPresentationNote}</p>
      </div>
    </section>
  );
}
